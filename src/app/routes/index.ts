import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { CategoryRoutes } from "../modules/catagory/category.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";
import { UserRoutes } from "../modules/user/user.route";
import { ShopRoutes } from "../modules/shop/shop.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/category", CategoryRoutes);
router.use("/users", UserRoutes);
router.use("/shops", ShopRoutes);
router.use("/payments", PaymentRoutes);
router.use("/subscriptions", SubscriptionRoutes);
// router.use("/product", );
// router.use("/order", );


export const IndexRoutes = router;