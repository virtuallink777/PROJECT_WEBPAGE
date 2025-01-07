import express from "express";
import connectToDatabase from "./config/db";
import "dotenv/config";
import { APP_ORIGIN, PORT } from "./constans/env";
import cors from "cors";
import cookieParser from "cookie-parser";
import errorHandler from "./middleware/errorHandler";
import { OK } from "./constans/http";
import authRoutes from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRoutes from "./routes/user.route";
import sessionRoutes from "./routes/session.route";
import dashboardRoutes from "./routes/dashboard.route";
import publicationsRouter from "./routes/publication.route";
import {
  publicacionesUpload,
  videosUpload,
} from "./routes/publicaciones.upload";
import getPublicationsThumbnailsByUserId from "./routes/publication.thumbnails.route";
import path from "node:path";

const app = express();

// Servir la carpeta "uploads"
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req, res, next) => {
  return res.status(OK).json({
    status: "healthy",
  });
});

// prefix: /auth
app.use("/auth", authRoutes);

// protected routes

app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

// prefix: /dashboard
app.use("/dashboard", authenticate, dashboardRoutes);

app.use("/publications", publicationsRouter);

app.use("/api/publicacionesImage", publicacionesUpload);
console.log("Ruta de publicaciones registrada correctamente");

app.use("/api/publicacionesVideo", videosUpload);
console.log("Ruta de subida de videos registrada correctamente");

app.use("/api/publicationsThumbnails", getPublicationsThumbnailsByUserId);

app.use(errorHandler);
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} in development mode`);
  await connectToDatabase();
});
