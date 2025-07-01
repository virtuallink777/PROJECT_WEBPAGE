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

import http from "http"; // ⚡ Para usar WebSockets
import { Server } from "socket.io"; // ⚡ Importar socket.io
import validateAdmin from "./routes/validatesAdmin";
import statePublications from "./routes/statePublications";
import { configureSockets } from "./routes/socketHandler";
import deletePublications from "./routes/deletePublications";
import { updatePublicationPayment } from "./routes/updatePublicationPayment";
import getPublicationsTOP from "./routes/getPublicationTOP";
import getPublicationsNOTOP from "./routes/getPublicationsNOTOP";
import updatePublicationsEndTop from "./routes/updatePublicationsEndTop";
import contactRoutes from "./routes/contact.route"; // Importamos el router correctamente
import metricsRoutes from "./routes/metrics"; // Importamos el router correctamente
import metricsRoutesAdmin from "./routes/metricsRoutesAdmin"; // Importamos el router correctamente

import pseRoutes from "./routes/pseRoutes"; // Importamos el router correctamente
import identityValidationRouterFromFile from "./routes/identityValidationRoutes";
import ImagesVideosUpload from "./routes/ImagesVideosUpload";
import { isUserOnlineForChat } from "./routes/socketHandler"; // Importar la función para chequear estado de usuario

const app = express();

const server = http.createServer(app); // ⚡ Crear servidor HTTP

export const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true }, // Permitir conexiones desde cualquier origen
});

// Configurar WebSockets con la función importada
configureSockets(io);

// --- NUEVA RUTA DE API PARA ESTADO DE PRESENCIA ---
app.get("/api/user-status/:userId", (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID es requerido" });
  }

  // Usa la función importada para chequear
  const online = isUserOnlineForChat(userId);

  res.status(200).json({ online });
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

//********RUTAS****** */

// prefix: /auth
app.use("/auth", authRoutes);

// protected routes

app.use("/user", authenticate, userRoutes);
app.use("/sessions", authenticate, sessionRoutes);

// prefix: /dashboard
app.use("/dashboard", authenticate, dashboardRoutes);

// ruta para subir las imagenes NUEVAS DE CREATE PUB A cloudinary  con creacion y verificacion de hashes
app.use("/api/publicacionesImage", publicacionesUpload);
console.log("Ruta de uploads por primera ok registrada correctamente");

// ruta para subir la publicacion nuevas a mongodb
app.use("/api/publications", authenticate, publicationsRouter);

// ruta para subir nuevas imagens y videos de publicaciones ya existentes a cloudinary con hashes
app.use("/api/publicacionesImageUpdate", ImagesVideosUpload);

// ruta para MONTAR LA MINIATURA DE LA PUBLICACION
app.use("/api/publicationsThumbnails", getPublicationsThumbnailsByUserId);

// RUTA PARA RENDERIZAR LAS PUBLICACIONES DE UN USUARIO
app.use("/api/publicationsByUserId/:id", getPublicationById);

// RUTA PARA ENCONTRAR LA PUBLICACION POR ID
app.use(
  "/api/editPublications/:id",

  getPublicationById
);

// RUTA PARA ACTUALIZAR LA PUBLICACION
app.use("/api/updatePublications", updatePublicationRoutes);

app.put(
  "/api/updatePublicationImagesVideos/:id",
  updatePublicationImagesVideos
);

// RUTA PÁRA GUARDAR LAS IMG DE VALIDATE Y ENVIAR DATOS AL ADMIN
app.use("/api/validate", validateAdmin);

// RUTA PARA VALIDAR EL DOCUMENTO DE IDENTIDAD
app.use("/api/validate-identity", identityValidationRouterFromFile);

// RUTA PARA GUARDAR EL ESTADO DE LA PUBLICACION
app.use("/api/state-publication", statePublications);

// RUTA PARA ELIMINAR PUBLICACIONES Y BORAR HASHES Y ARCHIVOS
app.use("/api/delete-publication", authenticate, deletePublications);

// RUTA PARA EL MANEJO DE ACTULIZACION DE PUBLICACIONES CON PAGO
app.post("/api/updatePublicationPayment/:id", updatePublicationPayment);

//ruta para obtener todas las publicaciones TOP
app.get("/api/publicationsTOP", getPublicationsTOP);

// ruta para obtener publicaciones no top
app.get("/api/publicationsNOTOP", getPublicationsNOTOP);

// ruta para actualizar las publicaciones que finalizaron top
app.use("/api/updatePublicationsEndTop", updatePublicationsEndTop);

// RUTA PARA LAS METRICAS
app.use("/api/metrics", metricsRoutes); // Usa el router en la ruta "/api/metrics"

// ruta PARA LAS METRICAS DEL ADMIN
app.use("/api/metricsAdmin", metricsRoutesAdmin);

// ruta para contactos
app.use("/api/contact", contactRoutes);

// RUTA PARA PAGO openpay
app.use("/api/pse", pseRoutes);

app.use(errorHandler);
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT} in development mode`);
  await connectToDatabase();
});
