import { Router } from "express";
import { createUser, getUserInfo, updateUserProfile } from "../controllers/UserController";
import { jwtCheck, jwtParse } from "../middlewares/auth";
import { validateUserRequest } from "../middlewares/validation";

const router = Router();

router
  .route("/")
  .post(jwtCheck, createUser)
  .put(validateUserRequest,jwtCheck, jwtParse,  updateUserProfile)
  .get(jwtCheck, jwtParse , getUserInfo);

export default router;
