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

const validateAdmin = express.Router();
const VALIDATIONS_FILE = path.join(__dirname, "../validations.json");

console.log("📂 Archivo de validaciones:", VALIDATIONS_FILE);

interface PendingValidation {
  body: any; // Si puedes definir mejor este tipo, es recomendable
  fileUrls: Record<string, string>;
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
]);

interface MulterFiles {
  fotoCartel?: Express.Multer.File[];
  fotoRostro?: Express.Multer.File[];
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

  const files = req.files as MulterFiles;
  const responseUrls: Record<string, string> = {};

  if (files.fotoCartel) {
    responseUrls.fotoCartel = `${baseUrl}/${files.fotoCartel[0].filename}`;
  }

  if (files.fotoRostro) {
    responseUrls.fotoRostro = `${baseUrl}/${files.fotoRostro[0].filename}`;
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

  if (adminSocket) {
    console.log(`📤 Enviando datos al administrador (${adminSocket})`);
    io.to(adminSocket).emit("validate-publication", req.body, responseUrls);
  } else {
    console.log("❌ Admin no encontrado. Guardando validación pendiente.");
    pendingValidations.push({ body: req.body, fileUrls: responseUrls });
    savePendingValidations();
  }
});

// 🔹 Función para limpiar validaciones pendientes sin reasignar
export const clearPendingValidations = () => {
  pendingValidations.length = 0; // Vacía el array sin cambiar la referencia
  savePendingValidations();
};

export default validateAdmin;
export { savePendingValidations, pendingValidations };
