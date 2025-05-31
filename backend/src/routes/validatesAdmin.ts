import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { io } from "..";
import {
  connectedAdmin,
  connectedUsers,
  getAdminSocket,
} from "../routes/socketHandler";
import { Request, Response } from "express";
// Importar la interfaz SocketIOServer desde socket.io
import { Server as SocketIOServer } from "socket.io"; // Si necesitas usar SocketIOServer en otro lugar

const validateAdmin = express.Router();
const VALIDATIONS_FILE = path.join(__dirname, "../validations.json");

console.log("📂 Archivo de validaciones:", VALIDATIONS_FILE);

interface PendingValidation {
  body: any; // Si puedes definir mejor este tipo, es recomendable
  fileUrls: Record<string, string>;
}

// Interfaz para los datos que llegan del evento "validate-identity-document"
interface IdentityValidationPayload {
  // <--- AQUÍ ESTÁ
  userId: string;
  publicationId: string; // ID de la publicación a la que pertenecen estos documentos
  body: any;
  fileUrls: {
    // URLs de documentFront y documentBack
    documentFront: string;
    documentBack: string;
  };
}

// Función para cargar validaciones desde el archivo al iniciar el servidor
const loadPendingValidations = (): PendingValidation[] => {
  try {
    if (fs.existsSync(VALIDATIONS_FILE)) {
      const data = fs.readFileSync(VALIDATIONS_FILE, "utf-8");
      return JSON.parse(data) as PendingValidation[];
    }
  } catch (error) {
    console.error("❌ Error al cargar validaciones:", error);
  }
  return []; // Siempre devuelve un array vacío si hay error
};

// 🔹 Inicializar validaciones pendientes
let pendingValidations: PendingValidation[] = [];
pendingValidations = loadPendingValidations();

// 🔹 Función para guardar validaciones en el archivo
const savePendingValidations = () => {
  try {
    console.log("💾 Guardando validaciones pendientes en el archivo...");
    fs.writeFileSync(
      VALIDATIONS_FILE,
      JSON.stringify(pendingValidations, null, 2),
      "utf-8"
    );
    console.log("✅ Validaciones guardadas correctamente en validations.json");
  } catch (error) {
    console.error("❌ Error al guardar en validations.json:", error);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.params.userId;
    const uploadPath = path.join(__dirname, `../uploads/${userId}`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    let timestamp = Date.now();
    let customFileName = file.fieldname;
    cb(null, `${customFileName}_${timestamp}.png`);
  },
});

const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: "fotoCartel", maxCount: 1 },
  { name: "fotoRostro", maxCount: 1 },
  { name: "documentFront", maxCount: 1 }, // Nuevo
  { name: "documentBack", maxCount: 1 }, // Nuevo
]);

interface MulterFiles {
  fotoCartel?: Express.Multer.File[];
  fotoRostro?: Express.Multer.File[];
  documentFront?: Express.Multer.File[]; // Nuevo
  documentBack?: Express.Multer.File[]; // Nuevo
}

validateAdmin.post("/:userId", uploadFields, (req, res) => {
  const dataItems = req.body.dataItems ? JSON.parse(req.body.dataItems) : {};

  const requestId = Date.now(); // Identificador único para cada solicitud
  console.log(`🆔 [${requestId}] Nueva solicitud recibida para validación`);
  console.log("Body:", req.body);
  console.log("Files:", req.files);
  console.log("DataItems:", dataItems);

  const userId = req.params.userId;
  const baseUrl = `http://localhost:4004/uploads/${userId}`;
  const baseUrlId = `http://localhost:4004/uploads/${userId}/identity_docs`;

  const files = req.files as MulterFiles;
  const responseUrls: Record<string, string> = {};

  // Para fotoCartel y fotoRostro
  if (files.fotoCartel && files.fotoCartel[0]) {
    responseUrls.fotoCartel = `${baseUrl}/${files.fotoCartel[0].filename}`;
  }
  if (files.fotoRostro && files.fotoRostro[0]) {
    responseUrls.fotoRostro = `${baseUrl}/${files.fotoRostro[0].filename}`;
  }

  // Para documentFront y documentBack
  if (files.documentFront && files.documentFront[0]) {
    responseUrls.documentFront = `${baseUrlId}/${files.documentFront[0].filename}`;
  }
  if (files.documentBack && files.documentBack[0]) {
    responseUrls.documentBack = `${baseUrlId}/${files.documentBack[0].filename}`;
  }

  console.log("datos enviados al admin:", req.body);
  console.log("urls de las imagenes:", responseUrls);

  res.status(200).json({
    message: "Datos recibidos correctamente",
    body: req.body,
    fileUrls: responseUrls,
  });

  // Emitir evento al administrador
  console.log("📡 Buscando socket del admin para userId:", userId);
  console.log("🔍 Sockets de admins conectados:", connectedAdmin);

  const adminSocket = getAdminSocket();

  const publicationIdFromBody = req.body.publicationId;
  const userIdFromParams = req.params.userId; // Ya lo tienes: const userId = req.params.userId;

  if (adminSocket) {
    // Condición para identificar que es una carga de documentos de identidad
    if (files.documentFront && files.documentBack && publicationIdFromBody) {
      console.log(
        `📤 Enviando datos de VALIDACIÓN DE DOCUMENTO al admin (${adminSocket})`
      );

      const payloadForIdentityValidation: IdentityValidationPayload = {
        userId: userIdFromParams, // El userId de la URL de la ruta
        publicationId: publicationIdFromBody, // El ID de la publicación del body
        body: req.body, // Puedes enviar el req.body completo o solo partes específicas
        fileUrls: {
          // responseUrls ya tiene documentFront y documentBack con las URLs correctas
          documentFront: responseUrls.documentFront!, // El '!' asume que si entraste al if, existen
          documentBack: responseUrls.documentBack!,
        },
      };

      // Emitir el evento correcto para la validación de identidad
      io.to(adminSocket).emit(
        "validate-identity-document",
        payloadForIdentityValidation
      );
      console.log(
        "✅ Datos de VALIDACIÓN DE DOCUMENTO enviados al admin con el evento 'validate-identity-document'."
      );
    } else if (files.fotoCartel || files.fotoRostro) {
      // Lógica para la validación de PUBLICACIÓN (cartel/rostro)
      console.log(
        `📤 Enviando datos de VALIDACIÓN DE PUBLICACIÓN al admin (${adminSocket})`
      );
      // Asegúrate que responseUrls solo contenga fotoCartel/fotoRostro o que el admin lo maneje
      const publicationResponseUrls: Record<string, string> = {};
      if (responseUrls.fotoCartel)
        publicationResponseUrls.fotoCartel = responseUrls.fotoCartel;
      if (responseUrls.fotoRostro)
        publicationResponseUrls.fotoRostro = responseUrls.fotoRostro;

      io.to(adminSocket).emit(
        "validate-publication",
        req.body,
        publicationResponseUrls
      ); // req.body aquí debería tener 'dataItems for sessionStorage'
      console.log(
        "✅ Datos de VALIDACIÓN DE PUBLICACIÓN enviados al admin con el evento 'validate-publication'."
      );
    } else {
      console.log(
        "⚠️ No se identificó un tipo de validación claro para emitir por socket o faltan datos."
      );
    }
  } else {
    console.log("❌ Admin no encontrado. Guardando validación pendiente.");
    // Aquí también necesitarías una lógica similar para 'pendingValidations'
    // para guardar el tipo correcto de datos y poder emitir el evento correcto después.
  }
});

// 🔹 Función para limpiar validaciones pendientes sin reasignar
export const clearPendingValidations = () => {
  pendingValidations.length = 0; // Vacía el array sin cambiar la referencia
  savePendingValidations();
};

export default validateAdmin;
export { savePendingValidations, pendingValidations };
