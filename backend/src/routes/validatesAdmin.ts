import express, { response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { io } from "..";

const validateAdmin = express.Router();

// 📂 Configurar almacenamiento dinámico en `multer`
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.params.userId;

    const uploadPath = path.join(__dirname, `../uploads/${userId}`);

    // 🟢 Verificar si la carpeta ya existe antes de crearla
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    let timestamp = Date.now(); // Obtener timestamp actual
    // 🟠 Asignar nombres específicos según el campo
    let customFileName = file.fieldname; // "fotoCartel" o "fotoRostro"
    cb(null, `${customFileName}_${timestamp}.png`); // 📂 "fotoCartel_1718123456789.png"
  },
});

const upload = multer({ storage });

// Middleware de multer para capturar imágenes específicas
const uploadFields = upload.fields([
  { name: "fotoCartel", maxCount: 1 },
  { name: "fotoRostro", maxCount: 1 },
]);

// 📌 Definir el tipo de archivos subidos
interface MulterFiles {
  fotoCartel?: Express.Multer.File[];
  fotoRostro?: Express.Multer.File[];
}

validateAdmin.post("/:userId", uploadFields, (req, res) => {
  console.log("Body:", req.body); // ✅ Aquí vienen los datos como userId, email, etc.
  console.log("Files:", req.files); // 📂 Aquí están las imágenes en la carpeta correcta

  const userId = req.params.userId;
  const baseUrl = `http://localhost:4004/uploads/${userId}`;

  // 📌 Extraer las URLs de los archivos subidos
  const files = req.files as MulterFiles;
  const responseUrls: Record<string, string> = {};

  if (files.fotoCartel) {
    responseUrls.fotoCartel = `${baseUrl}/${files.fotoCartel[0].filename}`;
  }

  if (files.fotoRostro) {
    responseUrls.fotoRostro = `${baseUrl}/${files.fotoRostro[0].filename}`;
  }

  // 📤 Responder con los datos y las URLs

  res.status(200).json({
    message: "Datos recibidos correctamente",
    body: req.body,
    fileUrls: responseUrls,
  });

  // Emitir evento WebSocket después de guardar en la base de datos
  io.emit("nueva-publicacion para VALIDAR", req.body, responseUrls);
});

export default validateAdmin;
