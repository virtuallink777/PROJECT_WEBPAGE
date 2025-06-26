// src/routes/identityValidationRoutes.ts

import express, { Request, Response, Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { io } from ".."; // Asumo que así obtienes la instancia global de io
import { getAdminSocket as getAdminSocketId } from "./socketHandler";
import publicationsModels from "../models/publications.models";

// 1. IMPORTAMOS TU MIDDLEWARE 'upload' EXISTENTE Y MEJORADO
import { upload } from "../middleware/upload";

// 2. DEFINIMOS LA INTERFAZ PARA LOS ARCHIVOS DE CLOUDINARY
//    Es crucial que ahora esperemos la propiedad 'path' que nos da Cloudinary.
interface CloudinaryFile extends Express.Multer.File {
  path: string;
}

// Interfaz para la estructura de archivos que esperamos
interface IdentityMulterFiles {
  documentFront?: CloudinaryFile[];
  documentBack?: CloudinaryFile[];
}

const identityRouter: Router = express.Router();

// --- ENDPOINT MODIFICADO PARA USAR CLOUDINARY ---
// La URL base para este router debe ser '/api/validate-identity' en tu app.ts,
// lo que permite que nuestro middleware 'upload' funcione correctamente.
identityRouter.post(
  "/:userId",
  // 3. APLICAMOS EL MIDDLEWARE 'upload' A LA RUTA
  //    Este se encargará de subir los archivos a Cloudinary en la carpeta correcta
  //    antes de que el resto de la lógica de la ruta se ejecute.
  upload.fields([
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { publicationId } = req.body;
    const files = req.files as IdentityMulterFiles | undefined;

    console.log(
      `🆔 Solicitud de validación de DOCUMENTO para UserID: ${userId}, PubID: ${publicationId}`
    );

    // La validación de que los archivos y el publicationId existen sigue siendo la misma.
    if (!files || !files.documentFront?.[0] || !files.documentBack?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Ambas caras del documento de identidad son requeridas.",
      });
    }
    if (!publicationId) {
      return res.status(400).json({
        success: false,
        message: "Falta el ID de la publicación (publicationId).",
      });
    }

    // Tu lógica para actualizar la base de datos se mantiene intacta.
    try {
      const updatedPublication = await publicationsModels.findByIdAndUpdate(
        publicationId,
        { $set: { estado: "PENDIENTE" } },
        { new: true }
      );
      if (!updatedPublication) {
        return res
          .status(404)
          .json({ success: false, message: "Publicación no encontrada." });
      }
      console.log(
        `✅ Estado de la publicación ${publicationId} actualizado a '${updatedPublication.estado}'.`
      );
    } catch (dbError) {
      console.error(
        `❌ Error al actualizar la publicación en MongoDB:`,
        dbError
      );
      return res.status(500).json({
        success: false,
        message: "Error interno al actualizar el estado de la publicación.",
      });
    }

    // 4. OBTENEMOS LAS URLS DIRECTAMENTE DE CLOUDINARY
    //    'multer-storage-cloudinary' convenientemente pone la URL final en la propiedad 'path'.
    const responseUrls = {
      documentFront: files.documentFront[0].path,
      documentBack: files.documentBack[0].path,
    };

    console.log(
      "URLs de Cloudinary obtenidas para la validación:",
      responseUrls
    );

    // Tu lógica para notificar al admin por socket se mantiene exactamente igual.
    const adminSocketTargetId = getAdminSocketId();
    if (adminSocketTargetId) {
      console.log(
        `📤 Enviando datos de DOCUMENTO al admin (Socket ID: ${adminSocketTargetId})`
      );
      (io as SocketIOServer)
        .to(adminSocketTargetId)
        .emit("validate-identity-document", {
          userId: userId,
          publicationId: publicationId,
          body: req.body,
          fileUrls: responseUrls,
        });
    } else {
      console.log(
        "❌ Admin no encontrado para DOCUMENTO. La validación quedará pendiente."
      );
      // Aquí iría tu lógica para guardar la validación en un archivo o BBDD si el admin no está.
    }

    // Respondemos al frontend con éxito.
    res.status(200).json({
      success: true,
      message: "Documentos subidos a Cloudinary y listos para validación.",
      fileUrls: responseUrls,
    });
  }
);

export default identityRouter;
