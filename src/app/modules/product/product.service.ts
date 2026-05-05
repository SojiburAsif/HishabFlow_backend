import status from "http-status";
import { Role } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";

interface IAuthenticatedUser {
  userId: string;
  role: Role;
  email: string;
  shopId?: string;
}

const createProduct = async (user: IAuthenticatedUser, payload: any) => {
  if (user.role !== Role.SHOP_OWNER && user.role !== Role.STAFF) {
    throw new AppError(status.FORBIDDEN, "Only shop owner or staff can create products");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({ where: { userId: user.userId }, include: { shop: true } });
  if (!ownerProfile || !ownerProfile.shop) {
    throw new AppError(status.BAD_REQUEST, "Shop not found for owner");
  }

  const shopId = ownerProfile.shop.id;

  const product = await prisma.product.create({ data: { shopId, ...payload } });
  return product;
};

const updateProduct = async (user: IAuthenticatedUser, productId: string, payload: any) => {
  if (user.role !== Role.SHOP_OWNER && user.role !== Role.STAFF) {
    throw new AppError(status.FORBIDDEN, "Only shop owner or staff can update products");
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(status.NOT_FOUND, "Product not found");

  // ensure product belongs to user's shop
  const ownerProfile = await prisma.shopOwnerProfile.findUnique({ where: { userId: user.userId }, include: { shop: true } });
  if (!ownerProfile || product.shopId !== ownerProfile.shop?.id) {
    throw new AppError(status.FORBIDDEN, "Not allowed to update this product");
  }

  const updated = await prisma.product.update({ where: { id: productId }, data: payload });
  return updated;
};

const listProducts = async (user: IAuthenticatedUser) => {
  if (user.role !== Role.SHOP_OWNER && user.role !== Role.STAFF) {
    throw new AppError(status.FORBIDDEN, "Only shop owner or staff can list products");
  }

  const ownerProfile = await prisma.shopOwnerProfile.findUnique({ where: { userId: user.userId }, include: { shop: true } });
  if (!ownerProfile || !ownerProfile.shop) throw new AppError(status.BAD_REQUEST, "Shop not found for owner");

  const products = await prisma.product.findMany({ where: { shopId: ownerProfile.shop.id } });
  return products;
};

export const ProductService = { createProduct, updateProduct, listProducts };
