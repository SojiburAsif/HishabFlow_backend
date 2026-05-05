import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { ShopController } from "./shop.controller";
import { createShopSchema, initiateCheckoutSchema, updateMyShopSchema } from "./shop.validation";

const router = Router();

// Initiate Stripe checkout for shop creation
router.post("/checkout", checkAuth(Role.SHOP_OWNER), validateRequest(initiateCheckoutSchema), ShopController.initiateShopCheckout);

// Create shop after payment confirmation (legacy - kept for backward compatibility)
router.post("/buy", checkAuth(Role.SHOP_OWNER), validateRequest(createShopSchema), ShopController.createShop);

// Get current user's shop
router.get("/me", checkAuth(Role.SHOP_OWNER), ShopController.getMyShop);
router.patch("/me", checkAuth(Role.SHOP_OWNER), validateRequest(updateMyShopSchema), ShopController.updateMyShop);

export const ShopRoutes = router;