import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { ShopController } from "./shop.controller";
import { createShopSchema } from "./shop.validation";

const router = Router();

router.post("/buy", checkAuth(Role.SHOP_OWNER), validateRequest(createShopSchema), ShopController.createShop);
router.get("/me", checkAuth(Role.SHOP_OWNER), ShopController.getMyShop);

export const ShopRoutes = router;