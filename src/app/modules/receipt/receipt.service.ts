import PDFDocument from "pdfkit";
import { prisma } from "../../lib/prisma";

interface IAuthenticatedUser {
  userId: string;
}

const generateReceiptPDF = async (user: IAuthenticatedUser, invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      shop: true,
      items: { include: { product: true } },
      createdByUser: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Verify ownership
  const ownerProfile = await prisma.shopOwnerProfile.findUnique({
    where: { userId: user.userId },
    include: { shop: true },
  });

  if (!ownerProfile || invoice.shopId !== ownerProfile.shop?.id) {
    throw new Error("Not authorized to view this invoice");
  }

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const formatMoney = (value: any) => Number(value?.toString?.() ?? value ?? 0).toFixed(2);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const leftX = doc.page.margins.left;
  const rightX = leftX + pageWidth;
  const cardWidth = pageWidth;

  const drawCard = (x: number, y: number, width: number, height: number, fillColor = "#ffffff") => {
    doc.save();
    doc.roundedRect(x, y, width, height, 14).fillAndStroke(fillColor, "#d8e2ea");
    doc.restore();
  };

  const safeText = (value?: string | null) => value && value.trim() ? value : "—";

  doc.rect(0, 0, doc.page.width, 120).fill("#0f172a");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(24).text(invoice.shop?.shopName || "Invoice", leftX, 30, { width: pageWidth, align: "center" });
  doc.font("Helvetica").fontSize(10).text(`Invoice #${invoice.invoiceNumber}`, leftX, 62, { width: pageWidth, align: "center" });
  doc.text(`Issued on ${invoice.createdAt.toLocaleDateString()}`, leftX, 76, { width: pageWidth, align: "center" });

  let cursorY = 140;

  drawCard(leftX, cursorY, cardWidth, 88, "#f8fbff");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text("INVOICE DETAILS", leftX + 16, cursorY + 14);
  doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`Status: ${invoice.status}`, leftX + 16, cursorY + 34);
  doc.text(`Payment Method: ${safeText(invoice.paymentMethod)}`, leftX + 16, cursorY + 50);
  doc.text(`Created By: ${safeText(invoice.createdByUser?.name)}`, leftX + 260, cursorY + 34);
  doc.text(`Customer Phone: ${safeText(invoice.customerPhone)}`, leftX + 260, cursorY + 50);

  cursorY += 104;

  if (invoice.customerName || invoice.customerPhone) {
    drawCard(leftX, cursorY, cardWidth, 70, "#fffdf7");
    doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text("CUSTOMER", leftX + 16, cursorY + 14);
    doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`Name: ${safeText(invoice.customerName)}`, leftX + 16, cursorY + 34);
    doc.text(`Phone: ${safeText(invoice.customerPhone)}`, leftX + 260, cursorY + 34);
    cursorY += 86;
  }

  const tableY = cursorY;
  const rowX = [leftX + 16, leftX + 235, leftX + 295, leftX + 380, leftX + 470];

  drawCard(leftX, tableY, cardWidth, 54 + invoice.items.length * 22 + 20, "#ffffff");
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(10);
  doc.text("Item", rowX[0], tableY + 16, { width: 180 });
  doc.text("Qty", rowX[1], tableY + 16, { width: 40, align: "right" });
  doc.text("Price", rowX[2], tableY + 16, { width: 70, align: "right" });
  doc.text("Total", rowX[3], tableY + 16, { width: 70, align: "right" });
  doc.text("Profit", rowX[4], tableY + 16, { width: 70, align: "right" });
  doc.moveTo(leftX + 16, tableY + 34).lineTo(rightX - 16, tableY + 34).strokeColor("#dbe4ee").stroke();

  let rowY = tableY + 44;
  invoice.items.forEach((item, index) => {
    const stripeColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";
    doc.rect(leftX + 10, rowY - 2, cardWidth - 20, 20).fill(stripeColor);
    doc.fillColor("#0f172a").font("Helvetica").fontSize(9);
    doc.text((item.product?.name || "Unknown").slice(0, 28), rowX[0], rowY, { width: 180 });
    doc.text(String(item.quantity), rowX[1], rowY, { width: 40, align: "right" });
    doc.text(formatMoney(item.sellingPrice), rowX[2], rowY, { width: 70, align: "right" });
    doc.text(formatMoney(item.lineTotal ?? Number(item.quantity) * Number(item.sellingPrice)), rowX[3], rowY, { width: 70, align: "right" });
    doc.text(formatMoney(item.lineProfit ?? 0), rowX[4], rowY, { width: 70, align: "right" });
    rowY += 22;
  });

  cursorY = rowY + 16;
  const totalsBoxHeight = 128;
  drawCard(leftX + 250, cursorY, 350, totalsBoxHeight, "#f8fbff");

  const totalsX = leftX + 266;
  const totalsLabelX = leftX + 260;
  const totalsValueX = leftX + 560;

  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(11).text("PAYMENT SUMMARY", totalsLabelX, cursorY + 14);
  doc.font("Helvetica").fontSize(10).fillColor("#334155");
  doc.text("Subtotal", totalsLabelX, cursorY + 38);
  doc.text(formatMoney(invoice.subtotal), totalsValueX - 70, cursorY + 38, { width: 70, align: "right" });
  doc.text("Discount", totalsLabelX, cursorY + 56);
  doc.text(formatMoney(invoice.discountAmount), totalsValueX - 70, cursorY + 56, { width: 70, align: "right" });
  doc.text("Tax", totalsLabelX, cursorY + 74);
  doc.text(formatMoney(invoice.taxAmount), totalsValueX - 70, cursorY + 74, { width: 70, align: "right" });
  doc.font("Helvetica-Bold").fillColor("#0f172a").text("Grand Total", totalsLabelX, cursorY + 96);
  doc.fontSize(12).fillColor("#14532d").text(formatMoney(invoice.grandTotal), totalsValueX - 90, cursorY + 94, { width: 90, align: "right" });

  cursorY += totalsBoxHeight + 26;
  doc.fillColor("#475569").font("Helvetica").fontSize(9);
  doc.text(`Total Cost: ${formatMoney(invoice.totalCost)}   |   Total Profit: ${formatMoney(invoice.totalProfit)}`, leftX, cursorY, { width: pageWidth });
  cursorY += 16;

  if (invoice.note) {
    doc.text(`Note: ${invoice.note}`, leftX, cursorY, { width: pageWidth });
    cursorY += 18;
  }

  doc.fillColor("#64748b").fontSize(8).text("Thank you for your business.", leftX, cursorY + 20, { width: pageWidth, align: "center" });

  return doc;
};

export const ReceiptService = {
  generateReceiptPDF,
};
