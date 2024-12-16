import { RequestHandler } from "express";

export const dashboardHandler: RequestHandler = (req, res) => {
  res.json({
    message: "Bienvenido al Panel de Control",
    userId: req.userId, // Esto viene del middleware authenticate
  });
};

export const dashboardSettingsHandler: RequestHandler = (req, res) => {
  res.json({
    message: "Configuraciones del Panel de Control",
    userId: req.userId, // Esto viene del middleware authenticate
  });
};

export const dashboardAnalyticsHandler: RequestHandler = (req, res) => {
  res.json({
    message: "Análisis del Panel de Control",
    userId: req.userId, // Esto viene del middleware authenticate
  });
};
