import express from "express";
import { io } from ".."; // Asumo que 'io' se exporta desde tu archivo principal
import { getAdminSocket } from "../routes/socketHandler"; // Ajusta la ruta si es necesario
import { upload } from "../middleware/upload"; // IMPORTAMOS TU ÚNICO MIDDLEWARE DE CLOUDINARY
import path from "path";
import fs from "fs";
import { Request, Response } from "express";

const validateAdmin = express.Router();

// --- Definición de Tipos (Sin cambios) ---
interface BasePendingValidation {
  type: "identity" | "publication";
  userId: string;
  originalBody: any;
  fileUrls: Record<string, string>;
}
export interface PendingIdentityValidation extends BasePendingValidation {
  type: "identity";
  publicationId: string;
}
export interface PendingPublicationValidation extends BasePendingValidation {
  type: "publication";
}
export type PendingValidation =
  | PendingIdentityValidation
  | PendingPublicationValidation;

interface IdentityValidationPayload {
  userId: string;
  publicationId: string;
  body: any;
  fileUrls: {
    documentFront: string;
    documentBack: string;
  };
}

// Interfaz para los archivos que vienen de Cloudinary
interface CloudinaryFile extends Express.Multer.File {
  path: string;
}
interface MulterFiles {
  fotoCartel?: CloudinaryFile[];
  fotoRostro?: CloudinaryFile[];
  documentFront?: CloudinaryFile[];
  documentBack?: CloudinaryFile[];
}

// --- Lógica de Validaciones Pendientes en JSON (Sin cambios) ---
const VALIDATIONS_FILE = path.join(__dirname, "../validations.json");

const loadPendingValidations = (): PendingValidation[] => {
  try {
    if (fs.existsSync(VALIDATIONS_FILE)) {
      const data = fs.readFileSync(VALIDATIONS_FILE, "utf-8");
      if (data) {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData)) {
          return parsedData as PendingValidation[];
        }
      }
    }
  } catch (error) {
    console.error("[VALIDATES_ADMIN] ❌ Error al cargar validaciones:", error);
  }
  return [];
};

let pendingValidations: PendingValidation[] = loadPendingValidations();

const savePendingValidations = () => {
  try {
    fs.writeFileSync(
      VALIDATIONS_FILE,
      JSON.stringify(pendingValidations, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error(
      "[VALIDATES_ADMIN] ❌ Error al guardar en validations.json:",
      error
    );
  }
};

export const clearPendingValidations = () => {
  if (pendingValidations.length > 0) {
    pendingValidations.length = 0;
    savePendingValidations();
  }
};

// --- RUTA POST ÚNICA PARA TODAS LAS VALIDACIONES ---
validateAdmin.post(
  "/:userId",
  // Usamos el middleware 'upload' de Cloudinary.
  // Este se encargará de subir todos los archivos posibles y poner las URLs en req.files
  upload.fields([
    { name: "fotoCartel", maxCount: 1 },
    { name: "fotoRostro", maxCount: 1 },
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    const userIdFromParams = req.params.userId;
    const publicationIdFromBody = req.body.publicationId;
    const files = req.files as MulterFiles;
    const requestId = Date.now();

    console.log(
      `\n[VALIDATES_ADMIN][${requestId}] --- Inicio de Solicitud de Validación (Cloudinary) ---`
    );
    console.log(
      `[VALIDATES_ADMIN][${requestId}] Para userId: ${userIdFromParams}`
    );

    // Construimos el objeto de URLs a partir de la propiedad 'path' que nos da Cloudinary
    const responseUrls: Record<string, string> = {};
    if (files.fotoCartel?.[0])
      responseUrls.fotoCartel = files.fotoCartel[0].path;
    if (files.fotoRostro?.[0])
      responseUrls.fotoRostro = files.fotoRostro[0].path;
    if (files.documentFront?.[0])
      responseUrls.documentFront = files.documentFront[0].path;
    if (files.documentBack?.[0])
      responseUrls.documentBack = files.documentBack[0].path;

    console.log(
      `[VALIDATES_ADMIN][${requestId}] URLs de Cloudinary construidas:`,
      responseUrls
    );

    // Respondemos al cliente inmediatamente para que no espere
    res.status(200).json({
      message: "Datos de validación recibidos y subidos a Cloudinary.",
      fileUrls: responseUrls,
    });

    // --- Lógica para Emitir al Admin o Guardar como Pendiente (SIN CAMBIOS, SOLO USANDO LAS NUEVAS URLs) ---
    const adminSocketId = getAdminSocket();
    const isAdminConnectedAndActive =
      adminSocketId && io.sockets.sockets.get(adminSocketId);

    if (isAdminConnectedAndActive) {
      console.log(
        `[VALIDATES_ADMIN][${requestId}] ✅ Admin CONECTADO (${adminSocketId}). Emitiendo en tiempo real...`
      );

      if (files.documentFront && files.documentBack && publicationIdFromBody) {
        console.log(
          `[VALIDATES_ADMIN][${requestId}] Tipo: VALIDACIÓN DE DOCUMENTO`
        );
        const payloadForIdentity: IdentityValidationPayload = {
          userId: userIdFromParams,
          publicationId: publicationIdFromBody,
          body: req.body,
          fileUrls: {
            documentFront: responseUrls.documentFront!,
            documentBack: responseUrls.documentBack!,
          },
        };
        io.to(adminSocketId).emit(
          "validate-identity-document",
          payloadForIdentity
        );
        console.log(
          `[VALIDATES_ADMIN][${requestId}] 🚀 Evento 'validate-identity-document' emitido.`
        );
      } else if (files.fotoCartel || files.fotoRostro) {
        console.log(
          `[VALIDATES_ADMIN][${requestId}] Tipo: VALIDACIÓN DE PUBLICACIÓN`
        );
        io.to(adminSocketId).emit(
          "validate-publication",
          req.body,
          responseUrls
        );
        console.log(
          `[VALIDATES_ADMIN][${requestId}] 🚀 Evento 'validate-publication' emitido.`
        );
      } else {
        console.warn(
          `[VALIDATES_ADMIN][${requestId}] ⚠️ No se identificó un tipo de validación claro para emitir.`
        );
      }
    } else {
      console.log(
        `[VALIDATES_ADMIN][${requestId}] ❌ Admin NO CONECTADO. Guardando validación pendiente.`
      );

      let validationToPush: PendingValidation | null = null;

      if (files.documentFront && files.documentBack && publicationIdFromBody) {
        validationToPush = {
          type: "identity",
          userId: userIdFromParams,
          publicationId: publicationIdFromBody,
          originalBody: req.body,
          fileUrls: {
            documentFront: responseUrls.documentFront!,
            documentBack: responseUrls.documentBack!,
          },
        };
      } else if (files.fotoCartel || files.fotoRostro) {
        validationToPush = {
          type: "publication",
          userId: userIdFromParams,
          originalBody: req.body,
          fileUrls: responseUrls,
        };
      }

      if (validationToPush) {
        pendingValidations.push(validationToPush);
        savePendingValidations();
        console.log(
          `[VALIDATES_ADMIN][${requestId}] 💾 Validación pendiente guardada. Total: ${pendingValidations.length}`
        );
      } else {
        console.warn(
          `[VALIDATES_ADMIN][${requestId}] ⚠️ No se pudo determinar el tipo de validación para guardar.`
        );
      }
    }
    console.log(
      `[VALIDATES_ADMIN][${requestId}] --- Fin de Solicitud de Validación ---`
    );
  }
);

export { savePendingValidations, pendingValidations };
export default validateAdmin;
