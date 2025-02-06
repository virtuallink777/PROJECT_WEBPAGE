import express from "express";
import { upload, copyToBackup } from "../middleware/upload";
import { FileHashService } from "../services/fileHashService";
import { BackupHash, UserHash } from "../models/hashImagesVideos";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

const router = express.Router();
const fileHashService = new FileHashService();

// 🔹 **Ruta para subir imágenes y videos (general)**
const publicacionesUpload = router.post(
  "/upload/:userId",
  upload.array("files"),
  copyToBackup,
  async (req, res) => {
    try {
      const userId = req.params.userId || req.body.userId;

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        console.log("el frontend no ha enviado archivos");
        return res
          .status(400)
          .json({ message: "el frontend no ha enviado archivos" });
      }

      const files = req.files as Express.Multer.File[];
      console.log("ARCHIVOS RECBIDOS DEL FRONTEND:", files);

      // Generar hashes para todos los archivos (imágenes y videos)
      const fileHashes = await Promise.all(
        files.map(async (file) => {
          const fileType = file.mimetype.startsWith("image")
            ? "image"
            : "video"; // Determinar el tipo de archivo
          return await fileHashService.generateFileHash(
            file.path,
            file.filename,
            fileType
          );
        })
      );

      // Buscar archivos duplicados en UserHash
      const existingHashes = await UserHash.findOne({ userId });
      const duplicateFiles = fileHashes.filter(
        (hash) =>
          existingHashes?.imageHashes.some((img) => img.hash === hash.hash) ||
          existingHashes?.videoHashes.some((vid) => vid.hash === hash.hash)
      );

      // Si hay archivos duplicados, no subir nada y responder con un mensaje
      if (duplicateFiles.length > 0) {
        console.log(`Archivos duplicados detectados: ${duplicateFiles.length}`);
        // Eliminar TODOS los archivos subidos (duplicados y no duplicados)
        files.forEach((file) => {
          try {
            const uploadPath = path.join(
              __dirname,
              `../uploads/${userId}/${file.filename}`
            );
            const backupPath = path.join(
              __dirname,
              `../uploadsBackup/${userId}/${file.filename}`
            );

            console.log(`Intentando eliminar archivo: ${file.filename}`);
            console.log(`Ruta de uploads: ${uploadPath}`);
            console.log(`Ruta de backup: ${backupPath}`);

            // Eliminar archivo de la carpeta de uploads
            if (fs.existsSync(uploadPath)) {
              fs.unlinkSync(uploadPath);
              console.log(`Archivo eliminado: ${uploadPath}`);
            } else {
              console.log(`El archivo no existe en uploads: ${uploadPath}`);
            }

            // Eliminar archivo de la carpeta de backup
            if (fs.existsSync(backupPath)) {
              fs.unlinkSync(backupPath);
              console.log(`Archivo eliminado: ${backupPath}`);
            } else {
              console.log(`El archivo no existe en backup: ${backupPath}`);
            }
          } catch (error) {
            console.error(`Error eliminando archivo: ${file.filename}`, error);
          }
        });

        return res.status(400).json({
          message:
            "Se detectaron archivos duplicados. No se subió ningún archivo.",
          duplicateFiles: duplicateFiles.map((f) => ({
            filename: f.fileName,
          })),
        });
      }

      // Si no hay duplicados, proceder a guardar los archivos
      await BackupHash.insertMany(fileHashes); // Guardar en BackupHash

      await UserHash.findOneAndUpdate(
        { userId },
        {
          $push: {
            imageHashes: {
              $each: fileHashes.filter((f) => f.fileType === "image"), // Solo imágenes
            },
            videoHashes: {
              $each: fileHashes.filter((f) => f.fileType === "video"), // Solo videos
            },
          },
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        message: "Archivos subidos exitosamente",
        uploadedFiles: fileHashes.map((f) => ({
          url: `/uploads/${userId}/${f.fileName}`,
          filename: f.fileName,
          type: f.fileType, // Incluir el tipo de archivo (image o video)
        })),
      });
    } catch (error) {
      console.error("Error al subir archivos:", error);
      res.status(500).json({ message: "Error al subir archivos", error });
    }
  }
);

export default publicacionesUpload;
