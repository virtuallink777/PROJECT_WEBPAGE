import { Router } from "express";
import authenticate from "../middleware/authenticate";
import {
  dashboardAnalyticsHandler,
  dashboardHandler,
  dashboardSettingsHandler,
} from "../controllers/dashboard.controller";

const dashboardRoutes = Router();

// prefix: /dashboard

dashboardRoutes.get("/", authenticate, dashboardHandler);
dashboardRoutes.get("/settings", authenticate, dashboardSettingsHandler);
dashboardRoutes.get("/analytics", authenticate, dashboardAnalyticsHandler);

export default dashboardRoutes;
