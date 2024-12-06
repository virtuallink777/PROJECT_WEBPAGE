import { Router } from "express";
import {
  deleteSessionhandler,
  getSessionsHandler,
} from "../controllers/session.controller";

const sessionRoutes = Router();

// prefix: /session

sessionRoutes.get("/", getSessionsHandler);
sessionRoutes.delete("/:id", deleteSessionhandler);

export default sessionRoutes;
