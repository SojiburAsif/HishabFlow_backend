import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { ProductController } from "./product.controller";
import { createProductSchema, updateProductSchema } from "./product.validation";

const router = Router();

router.post("/", checkAuth(Role.SHOP_OWNER, Role.STAFF), validateRequest(createProductSchema), ProductController.createProduct);
router.get("/", checkAuth(Role.SHOP_OWNER, Role.STAFF), ProductController.listProducts);
router.patch("/:id", checkAuth(Role.SHOP_OWNER, Role.STAFF), validateRequest(updateProductSchema), ProductController.updateProduct);

export const ProductRoutes = router;
