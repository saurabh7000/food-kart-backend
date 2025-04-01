import { Router } from "express";
import {
  createUpdateCart,
  deleteCartItem,
  getCartOrders,
} from "../controllers/CartController";
import { jwtCheck, jwtParse } from "../middlewares/auth";

const router = Router();

router
  .route("/")
  .post(jwtCheck, jwtParse, createUpdateCart)
  .get(jwtCheck, jwtParse, getCartOrders);

router.route("/:cartId/:itemToDelete").post(deleteCartItem);

export default router;
