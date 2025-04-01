import { Router } from "express";
import { param } from "express-validator";
import {
  getRestaurant,
  searchRestaurant,
} from "../controllers/RestaurtantController";

const router = Router();

router
  .route("/search/:city")
  .get(
    param("city")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("City parameter must be a valid string"),
    searchRestaurant
  );
  
router
  .route("/:restaurantId")
  .get(
    getRestaurant,
    param("restaurantId")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Restaurant Id parameter must be a valid string"),
    searchRestaurant
  );

export default router;
