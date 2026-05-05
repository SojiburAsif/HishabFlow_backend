import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { OrderController } from "./order.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createOrderSchema } from "./order.validation";

const router = Router();

router.post("/", checkAuth(Role.SHOP_OWNER, Role.STAFF), validateRequest(createOrderSchema), OrderController.createOrder);
router.get("/", checkAuth(Role.SHOP_OWNER, Role.STAFF), OrderController.listOrders);

export const OrderRoutes = router;
