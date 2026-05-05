import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { ReceiptService } from "./receipt.service";

const downloadReceipt = catchAsync(async (req: Request, res: Response) => {
  const invoiceId = Array.isArray(req.params.invoiceId) ? req.params.invoiceId[0] : req.params.invoiceId;

  const doc = await ReceiptService.generateReceiptPDF(req.user!, invoiceId);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoiceId}.pdf"`);

  doc.pipe(res);
  doc.end();
});

export const ReceiptController = { downloadReceipt };
