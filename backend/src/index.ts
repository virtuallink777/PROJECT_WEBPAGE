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
import publicacionesUpload from "./routes/publicaciones.upload";
import getPublicationsThumbnailsByUserId from "./routes/publication.thumbnails.route";
import path from "node:path";
import { getPublicationById } from "./routes/editPublication";
import updatePublicationRoutes from "./routes/updatedPublication.route";
import { updatePublicationImagesVideos } from "./controllers/updatePublicationImagesVideos";
import checkHashesCreatePub from "./routes/checkHashesCreatePub";
import http from "http"; // ⚡ Para usar WebSockets
import { Server } from "socket.io"; // ⚡ Importar socket.io
import validateAdmin from "./routes/validatesAdmin";

const app = express();

const server = http.createServer(app); // ⚡ Crear servidor HTTP
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Middleware para parsear JSON
app.use(express.json()); // Esto está bien para rutas POST/PUT

// Servir la carpeta "uploads"
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Encabezados permitidos
  })
);
app.use(cookieParser());

app.get("/", (req, res, next) => {
  return res.status(OK).json({
    status: "healthy",
  });
});

// **Inicializar WebSockets**
io.on("connection", (socket) => {
  console.log("⚡ Admin conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("⚡ Admin desconectado");
  });
});

//********RUTAS****** */

// prefix: /auth
app.use("/auth", authRoutes);

// protected routes

app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

// prefix: /dashboard
app.use("/dashboard", authenticate, dashboardRoutes);

// ruta para subir las imagenes NUEVAS DE CREATE PUB A uploads  con creacion y verificacion de hashes
app.use("/api/publicacionesImage", publicacionesUpload);
console.log("Ruta de uploads por primera ok registrada correctamente");

// ruta para subir la publicacion nuevas a mongodb
app.use("/publications", publicationsRouter);

// ruta para MONTAR LA MINIATURA DE LA PUBLICACION
app.use("/api/publicationsThumbnails", getPublicationsThumbnailsByUserId);

// RUTA PARA ENCONTRAR LA PUBLICACION POR ID
app.use("/api/editPublications/:id", getPublicationById);

// RUTA PARA ACTUALIZAR LA PUBLICACION
app.use("/api/updatePublications", updatePublicationRoutes);

app.put(
  "/api/updatePublicationImagesVideos/:id",
  updatePublicationImagesVideos
);

//RUTA PARA COMPARAR HASHES DE CREATEPUB
app.use("/api/check-hashes", checkHashesCreatePub);

// RUTA PÁRA GUARDAR LAS IMG DE VALIDATE Y ENVIAR DATOS AL ADMIN
app.use("/api/validate", validateAdmin);

app.use(errorHandler);
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} in development mode`);
  await connectToDatabase();
});
