import { Router } from "express";
import { jwtCheck, jwtParse } from "../middlewares/auth";
import {
  createCheckOutSession,
  stripeWebhookHandler,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/OrderController";

const router = Router();

router
  .route("/checkout/create-checkout-session")
  .post(jwtCheck, jwtParse, createCheckOutSession);
router.route("/checkout/webhook").post(stripeWebhookHandler);
router.route("/").get(jwtCheck, jwtParse, getMyOrders);
router
  .route("/order/:orderId/:restaurantId/status")
  .patch(jwtCheck, jwtParse, updateOrderStatus);

export default router;
