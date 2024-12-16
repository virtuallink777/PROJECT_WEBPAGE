import { Router } from "express";
import {
  getUserHandler,
  getUserProfileHandler,
} from "../controllers/user.controller";
import authenticate from "../middleware/authenticate";

const userRoutes = Router();

// prefix: /user

userRoutes.get("/", getUserHandler);
userRoutes.get("/me", authenticate, getUserProfileHandler);

export default userRoutes;
