// src/routes/identityValidationRoutes.ts
import express, { Request, Response, Router } from "express";
import multer, { FileFilterCallback } from "multer"; // Asegúrate de importar FileFilterCallback si usas fileFilter
import path from "path";
import fs from "fs";
import { Server as SocketIOServer } from "socket.io";
import { io } from "..";
import {
  getAdminSocket as getAdminSocketId,
  adminSocketId as adminSocketIdFromHandler, // Importar la variable global
  connectedAdmin as connectedAdminFromHandler, // Importar el objeto global
} from "./socketHandler";

// Interfaz para los archivos de Multer que esperamos para este endpoint
interface IdentityMulterFiles {
  documentFront?: Express.Multer.File[];
  documentBack?: Express.Multer.File[];
}

const identityRouter: Router = express.Router(); // NUEVO ROUTER para este archivo

// --- Configuración de Multer ---
// (Puedes copiar la 'storage' de tu otro archivo si la lógica de destino es la misma,
// pero considera una subcarpeta diferente para los documentos de identidad)
const storage = multer.diskStorage({
  destination: function (
    req: Request, // O Request<{ userId: string }>
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    const userId = (req.params as { userId: string }).userId;
    if (!userId) {
      return cb(new Error("User ID no proporcionado."), "");
    }
    // Subcarpeta específica para documentos de identidad
    const uploadPath = path.join(
      __dirname,
      `../uploads/${userId}/identity_docs`
    );
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
      } catch (mkdirError: any) {
        return cb(
          mkdirError instanceof Error
            ? mkdirError
            : new Error(String(mkdirError)),
          ""
        );
      }
    }
    cb(null, uploadPath);
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const timestamp = Date.now();
    cb(
      null,
      `${file.fieldname}_${timestamp}${path.extname(file.originalname)}`
    );
  },
});

// Opcional: Filtro de archivos si solo quieres imágenes
const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(null, false); // Rechazar archivo sin error
    // O: cb(new Error('Solo se permiten imágenes'));
  }
};

// Middleware de Multer configurado SÓLO para documentos de identidad
const uploadIdentityDocs = multer({
  storage: storage,
  fileFilter: imageFileFilter, // Añade el filtro
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
}).fields([
  { name: "documentFront", maxCount: 1 },
  { name: "documentBack", maxCount: 1 },
]);

// --- ENDPOINT PARA VALIDACIÓN DE DOCUMENTOS DE IDENTIDAD ---
// La ruta base será /api/validate-identity (definida en app.ts), aquí solo definimos /:userId
identityRouter.post(
  "/:userId",
  uploadIdentityDocs, // <--- USAR EL NOMBRE CORRECTO AQUÍ
  async (req: Request, res: Response) => {
    const userId = (req.params as { userId: string }).userId;
    // Multer pone los campos de texto del FormData en req.body
    const publicationIdFromBody = (req.body as { publicationId?: string })
      .publicationId;

    const requestId = Date.now().toString();

    console.log(
      `🆔 [ID_DOC-${requestId}] Solicitud validación DOCUMENTO para UserID: ${userId}, PubID: ${publicationIdFromBody}`
    );
    console.log("Body (Documento):", req.body);
    console.log("Files (Documento):", req.files);

    const files = req.files as IdentityMulterFiles | undefined;

    if (!files || !files.documentFront?.[0] || !files.documentBack?.[0]) {
      console.error(
        "Error: Faltan archivos documentFront o documentBack para UserID:",
        userId,
        files
      );
      return res.status(400).json({
        success: false,
        message: "Ambas caras del documento de identidad son requeridas.",
      });
    }
    if (!publicationIdFromBody) {
      console.error(
        "Error: publicationId no fue enviado en la solicitud para UserID:",
        userId
      );
      return res.status(400).json({
        success: false,
        message: "Falta el ID de la publicación (publicationId).",
      });
    }

    const baseUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/${userId}/identity_docs`;
    const responseUrls: Record<string, string> = {
      documentFront: `${baseUrl}/${files.documentFront[0].filename}`,
      documentBack: `${baseUrl}/${files.documentBack[0].filename}`,
    };

    console.log("URLs de docs (Identidad):", responseUrls);

    // Puedes quitar los logs de depuración de adminSocketIdFromHandler y connectedAdminFromHandler
    // ya que vimos que el problema anterior se resolvió.
    // console.log("--------------------------------------------------");
    // console.log("DEBUG: ANTES DE LLAMAR A getAdminSocketId()");
    // console.log("DEBUG: ... adminSocketIdFromHandler ...");
    // console.log("DEBUG: ... connectedAdminFromHandler ...");
    // console.log("--------------------------------------------------");

    const adminSocketTargetId: string | null = getAdminSocketId();

    if (adminSocketTargetId) {
      console.log(
        `📤 Enviando datos de DOCUMENTO al admin (Socket ID: ${adminSocketTargetId})`
      );
      (io as SocketIOServer)
        .to(adminSocketTargetId)
        .emit("validate-identity-document", {
          userId: userId,
          publicationId: publicationIdFromBody,
          body: req.body, // Opcional
          fileUrls: responseUrls,
        });
      console.log("✅ Datos de DOCUMENTO enviados al admin.");

      // Lógica para actualizar estado en BD (PENDIENTE - PASO FUTURO)
      // console.log(`TODO: Actualizar estado de publicación ${publicationIdFromBody} a 'EN_REVISION_IDENTIDAD'`);
    } else {
      console.log("❌ Admin no encontrado para DOCUMENTO.");
      // Lógica de pendientes para identidad aquí si es necesaria
    }

    res.status(200).json({
      success: true,
      message: "Documentos de identidad recibidos.",
      fileUrls: responseUrls,
    });
  }
);

export default identityRouter;
