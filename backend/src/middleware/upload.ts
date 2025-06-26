import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const userId = req.params.userId; // Obtiene el userId de la URL

    // Decidimos la subcarpeta basándonos en los campos que vienen
    let subfolder = "validation_images"; // Carpeta por defecto para cartel/rostro
    if (
      file.fieldname === "documentFront" ||
      file.fieldname === "documentBack"
    ) {
      subfolder = "identity_docs"; // Carpeta para documentos
    }

    const folderPath = `publicidades/${userId}/${subfolder}`;

    return {
      folder: `publicidades/${userId}`, // ¡Carpetas organizadas por usuario!
      allowed_formats: ["jpg", "png", "jpeg", "mp4", "webm", "webp"],
      resource_type: "auto",
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1000 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes o videos"));
    }
  },
});
