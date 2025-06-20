import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { io } from ".."; // Asumo que 'io' se exporta desde tu archivo principal (index.ts o app.ts)
import {
  connectedAdmin, // Lo usaremos para loguear
  getAdminSocket, // Esta función solo debe devolver el adminSocketId almacenado
} from "../routes/socketHandler"; // Asegúrate que la ruta a socketHandler es correcta
import { Request, Response } from "express";

const validateAdmin = express.Router();
const VALIDATIONS_FILE = path.join(__dirname, "../validations.json");

// --- Definición de Tipos para Claridad ---
interface BasePendingValidation {
  type: "identity" | "publication";
  userId: string;
  originalBody: any; // El req.body original que se envió en la solicitud de validación
  fileUrls: Record<string, string>; // URLs de los archivos relevantes para esta validación
}

export interface PendingIdentityValidation extends BasePendingValidation {
  type: "identity";
  publicationId: string; // El ID de la publicación asociada a esta validación de identidad
}

export interface PendingPublicationValidation extends BasePendingValidation {
  type: "publication";
  // No necesita publicationId aquí, ya que el body (originalBody) contendrá dataItems con el ID de la publicación
}

export type PendingValidation =
  | PendingIdentityValidation
  | PendingPublicationValidation;

// Interfaz para el payload que se emite al admin para validación de identidad
interface IdentityValidationPayload {
  userId: string;
  publicationId: string;
  body: any; // El req.body original
  fileUrls: {
    // Solo las URLs de los documentos
    documentFront: string;
    documentBack: string;
  };
}

// --- Carga y Guardado de Validaciones Pendientes ---
const loadPendingValidations = (): PendingValidation[] => {
  try {
    if (fs.existsSync(VALIDATIONS_FILE)) {
      console.log(`[VALIDATES_ADMIN] 📂 Leyendo archivo ${VALIDATIONS_FILE}`);

      const data = fs.readFileSync(VALIDATIONS_FILE, "utf-8");
      console.log("[VALIDATES_ADMIN] 📝 Contenido crudo del archivo:", {
        length: data.length,
        first100Chars:
          data.substring(0, 100) + (data.length > 100 ? "..." : ""),
      });

      const parsedData = JSON.parse(data);
      console.log("[VALIDATES_ADMIN] 🔍 Datos parseados:", {
        type: typeof parsedData,
        isArray: Array.isArray(parsedData),
        firstItem: Array.isArray(parsedData) ? parsedData[0] : parsedData,
      });

      // Validar que parsedData es un array antes de castear
      if (Array.isArray(parsedData)) {
        console.log("[VALIDATES_ADMIN] ✔️ Datos válidos, retornando array");
        // Log detallado del primer elemento para verificar las URLs
        if (parsedData.length > 0) {
          console.log("[VALIDATES_ADMIN] 🔎 Primer elemento del array:", {
            type: parsedData[0].type,
            userId: parsedData[0].userId,
            fileUrls: parsedData[0].fileUrls, // <-- Esto mostrará si las URLs están bien
          });
        }
        return parsedData as PendingValidation[];
      }
      console.error(
        "[VALIDATES_ADMIN] ❌ El contenido de validations.json no es un array."
      );
    } else {
      console.log(
        `[VALIDATES_ADMIN] No se encontró ${VALIDATIONS_FILE}, iniciando con 0 validaciones pendientes.`
      );
    }
  } catch (error) {
    console.error("[VALIDATES_ADMIN] ❌ Error al cargar validaciones:", error);
    // Log adicional para errores de parseo
    if (error instanceof SyntaxError) {
      console.error(
        "[VALIDATES_ADMIN] 🚨 El archivo JSON podría estar corrupto"
      );
    }
  }
  return [];
};

console.log("[VALIDATES_ADMIN] 📂 Archivo de validaciones:", VALIDATIONS_FILE);
let pendingValidations: PendingValidation[] = loadPendingValidations();
console.log(
  `[VALIDATES_ADMIN] Iniciado con ${pendingValidations.length} validaciones pendientes cargadas.`
);

const savePendingValidations = () => {
  try {
    console.log(
      `[VALIDATES_ADMIN] 💾 Guardando ${pendingValidations.length} validaciones pendientes en el archivo...`
    );
    fs.writeFileSync(
      VALIDATIONS_FILE,
      JSON.stringify(pendingValidations, null, 2),
      "utf-8"
    );
    console.log(
      "[VALIDATES_ADMIN] ✅ Validaciones guardadas correctamente en validations.json"
    );
  } catch (error) {
    console.error(
      "[VALIDATES_ADMIN] ❌ Error al guardar en validations.json:",
      error
    );
  }
};

// --- Configuración de Multer ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.params.userId;
    if (!userId) {
      console.error(
        "[VALIDATES_ADMIN][MULTER] userId no encontrado en req.params para la subida."
      );
      return cb(new Error("userId no encontrado para la subida"), "");
    }
    const uploadPath = path.join(__dirname, `../uploads/${userId}`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalExtension = path.extname(file.originalname) || ".png"; // Usar extensión original o png por defecto
    cb(null, `${file.fieldname}_${timestamp}${originalExtension}`);
  },
});

const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: "fotoCartel", maxCount: 1 },
  { name: "fotoRostro", maxCount: 1 },
  { name: "documentFront", maxCount: 1 },
  { name: "documentBack", maxCount: 1 },
]);

interface MulterFiles {
  fotoCartel?: Express.Multer.File[];
  fotoRostro?: Express.Multer.File[];
  documentFront?: Express.Multer.File[];
  documentBack?: Express.Multer.File[];
}

// --- Ruta POST para Validaciones ---
validateAdmin.post("/:userId", uploadFields, (req: Request, res: Response) => {
  const userIdFromParams = req.params.userId;
  const publicationIdFromBody = req.body.publicationId; // Para validación de identidad
  const dataItemsString = req.body.dataItems;

  const requestId = Date.now();
  console.log(
    `\n[VALIDATES_ADMIN][${requestId}] --- Inicio de Solicitud de Validación ---`
  );
  console.log(
    `[VALIDATES_ADMIN][${requestId}] 🆔 Para userId: ${userIdFromParams}`
  );
  console.log(`[VALIDATES_ADMIN][${requestId}] Body recibido:`, req.body);
  console.log(`[VALIDATES_ADMIN][${requestId}] Files recibidos:`, req.files);

  let parsedDataItems = {}; // Para 'dataItems for sessionStorage'
  if (dataItemsString && typeof dataItemsString === "string") {
    try {
      parsedDataItems = JSON.parse(dataItemsString);
      console.log(
        `[VALIDATES_ADMIN][${requestId}] DataItems parseados:`,
        parsedDataItems
      );
    } catch (e) {
      console.error(
        `[VALIDATES_ADMIN][${requestId}] Error parseando dataItems:`,
        e
      );
    }
  }

  const files = req.files as MulterFiles;
  const responseUrls: Record<string, string> = {};

  const generateFileUrl = (userId: string, filename: string) => {
    // Asumiendo que tu servidor sirve estáticos desde una ruta base como /uploads
    return `http://localhost:4004/uploads/${userId}/${filename}`;
  };

  console.log("Archivos recibidos:", {
    fotoCartel: files.fotoCartel?.[0]?.filename,
    fotoRostro: files.fotoRostro?.[0]?.filename,
    documentFront: files.documentFront?.[0]?.filename,
    documentBack: files.documentBack?.[0]?.filename,
  });

  if (files.fotoCartel?.[0]?.filename) {
    responseUrls.fotoCartel = generateFileUrl(
      userIdFromParams,
      files.fotoCartel[0].filename
    );
  }
  if (files.fotoRostro?.[0]?.filename) {
    responseUrls.fotoRostro = generateFileUrl(
      userIdFromParams,
      files.fotoRostro[0].filename
    );
  }
  if (files.documentFront?.[0]?.filename) {
    responseUrls.documentFront = generateFileUrl(
      userIdFromParams,
      files.documentFront[0].filename
    );
  }
  if (files.documentBack?.[0]?.filename) {
    responseUrls.documentBack = generateFileUrl(
      userIdFromParams,
      files.documentBack[0].filename
    );
  }
  console.log(
    `[VALIDATES_ADMIN][${requestId}] URLs de archivos construidas:`,
    responseUrls
  );

  // Enviar respuesta HTTP al cliente que subió los archivos inmediatamente
  res.status(200).json({
    message: "Datos de validación recibidos correctamente por el backend.",
    body: req.body,
    fileUrls: responseUrls,
  });

  // --- Lógica para Emitir al Admin o Guardar como Pendiente ---
  const adminSocketId = getAdminSocket(); // Obtiene el ID almacenado
  const isAdminConnectedAndActive =
    adminSocketId && io.sockets.sockets.get(adminSocketId); // Verifica si el socket con ese ID está activo

  console.log(
    `[VALIDATES_ADMIN][${requestId}] 📡 Verificando estado del admin...`
  );
  console.log(
    `[VALIDATES_ADMIN][${requestId}]   adminSocketId obtenido de getAdminSocket(): ${adminSocketId}`
  );
  console.log(
    `[VALIDATES_ADMIN][${requestId}]   ¿Socket de admin ${adminSocketId} está activo?: ${!!isAdminConnectedAndActive}`
  );
  console.log(
    `[VALIDATES_ADMIN][${requestId}]   Contenido de connectedAdmin (mapa en socketHandler):`,
    connectedAdmin
  );

  if (isAdminConnectedAndActive && adminSocketId) {
    // Asegurarse que adminSocketId no es null aquí
    console.log(
      `[VALIDATES_ADMIN][${requestId}] ✅ Admin CONECTADO y ACTIVO (${adminSocketId}). Emitiendo en tiempo real...`
    );

    if (files.documentFront && files.documentBack && publicationIdFromBody) {
      console.log(
        `[VALIDATES_ADMIN][${requestId}]   Tipo: VALIDACIÓN DE DOCUMENTO para publicationId ${publicationIdFromBody}`
      );
      const payloadForIdentity: IdentityValidationPayload = {
        userId: userIdFromParams,
        publicationId: publicationIdFromBody,
        body: req.body, // El body original de la solicitud
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
        `[VALIDATES_ADMIN][${requestId}]   🚀 Evento 'validate-identity-document' emitido a ${adminSocketId}.`
      );
    } else if (files.fotoCartel || files.fotoRostro) {
      console.log(
        `[VALIDATES_ADMIN][${requestId}]   Tipo: VALIDACIÓN DE PUBLICACIÓN`
      );
      const publicationFileUrls: Record<string, string> = {};
      if (responseUrls.fotoCartel)
        publicationFileUrls.fotoCartel = responseUrls.fotoCartel;
      if (responseUrls.fotoRostro)
        publicationFileUrls.fotoRostro = responseUrls.fotoRostro;

      // El primer argumento para 'validate-publication' es el 'body' que contiene 'dataItems for sessionStorage'
      io.to(adminSocketId).emit(
        "validate-publication",
        req.body,
        publicationFileUrls
      );
      console.log(
        `[VALIDATES_ADMIN][${requestId}]   🚀 Evento 'validate-publication' emitido a ${adminSocketId}.`
      );
    } else {
      console.warn(
        `[VALIDATES_ADMIN][${requestId}]   ⚠️ No se identificó un tipo de validación claro (documentos o cartel/rostro) o faltan archivos para emitir en tiempo real.`
      );
    }
  } else {
    console.log(
      `[VALIDATES_ADMIN][${requestId}] ❌ Admin NO CONECTADO o socket no activo. Guardando validación pendiente.`
    );

    let validationToPush: PendingValidation | null = null;

    if (files.documentFront && files.documentBack && publicationIdFromBody) {
      validationToPush = {
        type: "identity",
        userId: userIdFromParams,
        publicationId: publicationIdFromBody,
        originalBody: req.body, // Guardar el body completo
        fileUrls: {
          // Solo las URLs relevantes para este tipo
          documentFront: responseUrls.documentFront!,
          documentBack: responseUrls.documentBack!,
        },
      };
      console.log(
        "[VALIDATES_ADMIN]   Preparada validación de IDENTIDAD para guardar:",
        JSON.stringify(validationToPush, null, 2)
      );
    } else if (files.fotoCartel || files.fotoRostro) {
      const relevantFileUrls: Record<string, string> = {};
      if (responseUrls.fotoCartel)
        relevantFileUrls.fotoCartel = responseUrls.fotoCartel;
      if (responseUrls.fotoRostro)
        relevantFileUrls.fotoRostro = responseUrls.fotoRostro;

      if (Object.keys(relevantFileUrls).length > 0) {
        validationToPush = {
          type: "publication",
          userId: userIdFromParams,
          originalBody: req.body, // Guardar el body completo
          fileUrls: relevantFileUrls,
        };
        console.log(
          "[VALIDATES_ADMIN]   Preparada validación de PUBLICACIÓN para guardar:",
          JSON.stringify(validationToPush, null, 2)
        );
      } else {
        console.warn(
          "[VALIDATES_ADMIN]   No hay URLs de fotoCartel o fotoRostro para guardar en validación de publicación pendiente."
        );
      }
    }

    if (validationToPush) {
      pendingValidations.push(validationToPush);
      console.log(
        `[VALIDATES_ADMIN][${requestId}]   💾 Validación añadida a pendingValidations. Total pendientes ahora: ${pendingValidations.length}`
      );
      // Loguear el contenido completo puede ser muy verboso si hay muchas, pero útil para depurar una:
      // console.log(`[VALIDATES_ADMIN][${requestId}]   Contenido de UN PENDIENTE (el último):`, JSON.stringify(validationToPush, null, 2));
      savePendingValidations();
    } else {
      console.warn(
        `[VALIDATES_ADMIN][${requestId}]   ⚠️ No se pudo determinar el tipo de validación para guardar como pendiente o no había archivos relevantes.`
      );
    }
  }
  console.log(
    `[VALIDATES_ADMIN][${requestId}] --- Fin de Solicitud de Validación ---`
  );
});

// --- Funciones de Ayuda ---
export const clearPendingValidations = () => {
  if (pendingValidations.length > 0) {
    console.log(
      `[VALIDATES_ADMIN] Limpiando ${pendingValidations.length} validaciones pendientes.`
    );
    pendingValidations.length = 0;
    savePendingValidations(); // Guarda el array vacío en el archivo
  } else {
    // console.log("[VALIDATES_ADMIN] No hay validaciones pendientes que limpiar."); // Puede ser ruidoso
  }
};

export { savePendingValidations, pendingValidations };
export default validateAdmin;
