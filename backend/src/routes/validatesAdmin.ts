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

// --- RUTA POST ÚNICA PARA TODAS LAS VALIDACIONES (CON LÓGICA CORREGIDA) ---
validateAdmin.post(
  "/:userId",
  upload.fields([
    { name: "fotoCartel", maxCount: 1 },
    { name: "fotoRostro", maxCount: 1 },
    { name: "documentFront", maxCount: 1 },
    { name: "documentBack", maxCount: 1 },
  ]),
  (req: Request, res: Response) => {
    const userIdFromParams = req.params.userId;
    const files = req.files as MulterFiles;
    const requestId = Date.now();

    console.log(
      `\n[VALIDATES_ADMIN][${requestId}] --- Inicio de Solicitud de Validación ---`
    );

    // 1. OBTENEMOS LAS URLs DE LOS ARCHIVOS DE VALIDACIÓN RECIÉN SUBIDOS
    const validationFileUrls: Record<string, string> = {};
    if (files.fotoCartel?.[0])
      validationFileUrls.fotoCartel = files.fotoCartel[0].path;
    if (files.fotoRostro?.[0])
      validationFileUrls.fotoRostro = files.fotoRostro[0].path;
    if (files.documentFront?.[0])
      validationFileUrls.documentFront = files.documentFront[0].path;
    if (files.documentBack?.[0])
      validationFileUrls.documentBack = files.documentBack[0].path;

    // Respondemos al cliente inmediatamente para que no espere
    res.status(200).json({
      message: "Datos de validación recibidos y en proceso.",
      fileUrls: validationFileUrls,
    });

    // 2. PARSEAMOS TODA LA INFORMACIÓN QUE VIENE EN EL BODY
    // Usamos 'try-catch' para evitar que el servidor crashee si el JSON es inválido.
    let dataItems: any = {};
    try {
      dataItems = JSON.parse(req.body.dataItems || "{}");
    } catch (e) {
      console.error("Error parseando dataItems:", e);
    }

    let originalImageUrls: string[] = [];
    try {
      originalImageUrls = JSON.parse(req.body.originalImageUrls || "[]");
    } catch (e) {
      console.error("Error parseando originalImageUrls:", e);
    }

    let originalVideoUrls: string[] = [];
    try {
      originalVideoUrls = JSON.parse(req.body.originalVideoUrls || "[]");
    } catch (e) {
      console.error("Error parseando originalVideoUrls:", e);
    }

    const publicationId =
      req.body.publicationId || dataItems.publicationId || dataItems._id;

    // --- AÑADE ESTOS LOGS DE DIAGNÓSTICO ---
    console.log("DIAGNÓSTICO: Contenido de req.body:", req.body);
    console.log("DIAGNÓSTICO: Contenido de dataItems parseado:", dataItems);
    console.log(
      "DIAGNÓSTICO: Valor final de 'publicationId' que se usará:",
      publicationId
    );
    // --- FIN DE LOS LOGS ---

    // 3. CONSTRUIMOS EL PAQUETE DE DATOS COMPLETO
    const payloadCompleto = {
      userId: userIdFromParams,
      publicationId: publicationId,
      email: dataItems.email,
      images: originalImageUrls.map((url) => ({ url })), // Convertimos a la estructura que el AdminPanel espera
      videos: originalVideoUrls.map((url) => ({ url })),
      shippingDateValidate: req.body.shippingDateValidate,
      responseUrls: validationFileUrls, // Las URLs de fotoCartel, fotoRostro, etc.
    };

    // 4. LÓGICA PARA EMITIR O GUARDAR
    const adminSocketId = getAdminSocket();
    const isAdminConnectedAndActive =
      adminSocketId && io.sockets.sockets.get(adminSocketId);

    if (isAdminConnectedAndActive) {
      console.log(
        `[VALIDATES_ADMIN][${requestId}] ✅ Admin CONECTADO. Emitiendo...`
      );

      if (files.documentFront && files.documentBack) {
        console.log(
          `[VALIDATES_ADMIN][${requestId}] Tipo: VALIDACIÓN DE DOCUMENTO`
        );
        // El evento de identidad puede necesitar una estructura específica
        const payloadForIdentity: IdentityValidationPayload = {
          userId: userIdFromParams,
          publicationId: publicationId,
          body: req.body, // Mantenemos el body original por si se usa
          fileUrls: {
            documentFront: validationFileUrls.documentFront!,
            documentBack: validationFileUrls.documentBack!,
          },
        };
        io.to(adminSocketId).emit(
          "validate-identity-document",
          payloadForIdentity
        );
      } else if (files.fotoCartel || files.fotoRostro) {
        console.log(
          `[VALIDATES_ADMIN][${requestId}] Tipo: VALIDACIÓN DE PUBLICACIÓN`
        );
        // Emitimos el payload completo que construimos
        io.to(adminSocketId).emit("validate-publication", payloadCompleto);
      }
    } else {
      console.log(
        `[VALIDATES_ADMIN][${requestId}] ❌ Admin NO CONECTADO. Guardando pendiente.`
      );

      let validationToPush: PendingValidation | null = null;

      if (files.documentFront && files.documentBack) {
        validationToPush = {
          type: "identity",
          userId: userIdFromParams,
          publicationId: publicationId,
          originalBody: req.body, // Guardamos el body original para consistencia
          fileUrls: {
            documentFront: validationFileUrls.documentFront!,
            documentBack: validationFileUrls.documentBack!,
          },
        };
      } else if (files.fotoCartel || files.fotoRostro) {
        // Usamos el payload completo también para guardar
        validationToPush = {
          type: "publication",
          userId: userIdFromParams,
          originalBody: payloadCompleto, // Guardamos el objeto completo y bien estructurado
          fileUrls: validationFileUrls,
        };
      }

      if (validationToPush) {
        pendingValidations.push(validationToPush);
        savePendingValidations();
        console.log(
          `[VALIDATES_ADMIN][${requestId}] 💾 Validación pendiente guardada.`
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
