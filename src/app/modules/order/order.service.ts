import status from "http-status";
import { Prisma } from "../../../generated/prisma/browser";
import { Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

interface IAuthenticatedUser {
  userId: string;
  role: Role;
  email: string;
}

const createOrder = async (user: IAuthenticatedUser, payload: any) => {
  if (user.role !== Role.SHOP_OWNER && user.role !== Role.STAFF) {
    throw new AppError(status.FORBIDDEN, "Only shop owner or staff can create orders");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({ where: { userId: user.userId }, include: { shop: true } });
  if (!ownerProfile || !ownerProfile.shop) throw new AppError(status.BAD_REQUEST, "Shop not found for owner");

  const shopId = ownerProfile.shop.id;

  // fetch products and compute totals
  const productIds = payload.items.map((i: any) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  const productMap: Record<string, any> = {};
  products.forEach((p) => (productMap[p.id] = p));

  let subtotal = 0;
  let totalCost = 0;

  const items = payload.items.map((it: any) => {
    const p = productMap[it.productId];
    if (!p) throw new AppError(status.BAD_REQUEST, `Product not found: ${it.productId}`);
    const qty = Number(it.quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError(status.BAD_REQUEST, `Invalid quantity for product ${p.name}`);
    }

    if (Number(p.stock) < qty) {
      throw new AppError(status.BAD_REQUEST, `Insufficient stock for product ${p.name}`);
    }

    const sellingPrice = new Prisma.Decimal(p.sellingPrice.toString());
    const purchasePrice = new Prisma.Decimal(p.purchasePrice.toString());
    const lineTotal = sellingPrice.mul(qty);
    const lineCost = purchasePrice.mul(qty);
    const lineProfit = lineTotal.sub(lineCost);

    subtotal += lineTotal.toNumber();
    totalCost += lineCost.toNumber();
    return {
      productId: p.id,
      quantity: qty,
      purchasePrice: purchasePrice.toFixed(2),
      sellingPrice: sellingPrice.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      lineProfit: lineProfit.toFixed(2),
    };
  });

  const grandTotal = subtotal; // ignoring taxes/discounts for now

  const invoiceNumber = `INV-${Date.now()}`;

  const created = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        shopId,
        createdByUserId: user.userId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        subtotal: subtotal.toFixed(2).toString(),
        discountAmount: "0",
        taxAmount: "0",
        grandTotal: grandTotal.toFixed(2).toString(),
        totalCost: totalCost.toFixed(2).toString(),
        totalProfit: (grandTotal - totalCost).toFixed(2).toString(),
        status: "PAID",
        note: payload.note,
        items: {
          create: items.map((it: any) => ({
            productId: it.productId,
            quantity: it.quantity,
            purchasePrice: it.purchasePrice,
            sellingPrice: it.sellingPrice,
            lineTotal: it.lineTotal,
            lineProfit: it.lineProfit,
          })),
        },
      },
      include: { items: true },
    });

    // update product stock and create stock movements
    for (const it of items) {
      const stockUpdate = await tx.product.updateMany({
        where: {
          id: it.productId,
          stock: { gte: it.quantity },
        },
        data: {
          stock: { decrement: it.quantity },
        },
      });

      if (stockUpdate.count === 0) {
        throw new AppError(status.BAD_REQUEST, `Insufficient stock for product ${it.productId}`);
      }

      await tx.stockMovement.create({
        data: {
          productId: it.productId,
          shopId,
          invoiceId: invoice.id,
          movementType: "SALE",
          quantity: it.quantity,
          unitCost: it.purchasePrice,
          unitPrice: it.sellingPrice,
          balanceAfter: undefined,
          reference: invoice.invoiceNumber,
        },
      });
    }

    return invoice;
  });

  return created;
};

const listOrders = async (user: IAuthenticatedUser) => {
  if (user.role !== Role.SHOP_OWNER && user.role !== Role.STAFF) {
    throw new AppError(status.FORBIDDEN, "Only shop owner or staff can list orders");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({ where: { userId: user.userId }, include: { shop: true } });
  if (!ownerProfile || !ownerProfile.shop) throw new AppError(status.BAD_REQUEST, "Shop not found for owner");

  const invoices = await prisma.invoice.findMany({ where: { shopId: ownerProfile.shop.id }, include: { items: true } });
  return invoices;
};

export const OrderService = { createOrder, listOrders };
