import multer from "multer";
import path from "path";
import fs from "fs";

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.params.userId;
    if (!userId) {
      return cb(new Error("userId is required"), "");
    }

    const uploadPath = path.join(__dirname, `../uploads/${userId}`); // carpeta para cada cliente

    // Crear la carpeta si no existe
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1000 },
  fileFilter: (req, file, cb) => {
    // Verificar si el archivo es una imagen
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true); // Aceptar archivo
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

export default upload;
