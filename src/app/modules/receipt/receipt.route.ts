import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { ReceiptController } from "./receipt.controller";

const router = Router();

router.get("/:invoiceId/pdf", checkAuth(Role.SHOP_OWNER, Role.STAFF), ReceiptController.downloadReceipt);

export const ReceiptRoutes = router;
