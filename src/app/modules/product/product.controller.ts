import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ProductService } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.createProduct(req.user!, req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: "Product created", data: result });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const productId = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!productId) throw new Error("Invalid product id");
  const result = await ProductService.updateProduct(req.user!, productId, req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Product updated", data: result });
});

const listProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductService.listProducts(req.user!);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: "Products listed", data: result });
});

export const ProductController = { createProduct, updateProduct, listProducts };
