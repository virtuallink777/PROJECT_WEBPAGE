// routes/imageVerification.ts
import express from "express";
import multer from "multer";
import crypto from "crypto";
import sharp from "sharp";
import { ImageHash } from "../models/ImageHash";

const router = express.Router();
const upload = multer();

// Función para calcular el hash de una imagen
const calcularHash = async (buffer: Buffer): Promise<string> => {
  // Opcional: Usamos sharp para normalizar la imagen antes de calcular el hash
  const resizedBuffer = await sharp(buffer).resize(300).toBuffer();

  // Usamos SHA256 para calcular el hash único
  const hash = crypto.createHash("sha256").update(resizedBuffer).digest("hex");
  return hash;
};

// Endpoint para verificar imágenes repetidas
const imageVerificationRoutes = router.post(
  "/verify-duplicate-images",
  upload.array("files"),
  async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No se proporcionaron imágenes" });
      }

      // Array para almacenar el resultado de la verificación
      const isDuplicateArray: boolean[] = [];

      for (const file of files) {
        const hash = await calcularHash(file.buffer);

        // Verificar si el hash ya existe en la base de datos
        const existingImage = await ImageHash.findOne({ hash });

        if (existingImage) {
          // Si ya existe, se considera repetida
          isDuplicateArray.push(true);
        } else {
          // Si no existe, se guarda en la base de datos y no es repetida
          await ImageHash.create({ hash });
          isDuplicateArray.push(false);
        }
      }

      // Enviar el array de resultados
      return res.status(200).json({ isDuplicateArray });
    } catch (error) {
      console.error("Error al verificar imágenes:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

export default imageVerificationRoutes;
