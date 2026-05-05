import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { CategoryRoutes } from "../modules/catagory/category.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";
import { UserRoutes } from "../modules/user/user.route";
import { ShopRoutes } from "../modules/shop/shop.route";
import { StaffRoutes } from "../modules/staff/staff.route";
import { ProductRoutes } from "../modules/product/product.route";
import { OrderRoutes } from "../modules/order/order.route";
import { ReceiptRoutes } from "../modules/receipt/receipt.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { SessionRoutes } from "../modules/session/session.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/category", CategoryRoutes);
router.use("/users", UserRoutes);
router.use("/shops", ShopRoutes);
router.use("/payments", PaymentRoutes);
router.use("/subscriptions", SubscriptionRoutes);
router.use("/staff", StaffRoutes);

router.use("/product", ProductRoutes);
router.use("/order", OrderRoutes);
router.use("/receipt", ReceiptRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/sessions", SessionRoutes);


export const IndexRoutes = router;