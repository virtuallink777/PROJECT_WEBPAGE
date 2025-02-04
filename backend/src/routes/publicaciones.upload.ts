import express from "express";
import { upload, copyToBackup } from "../middleware/upload";
import { FileHashService } from "../services/fileHashService";
import { BackupHash, UserHash } from "../models/hashImagesVideos";
import path from "path";
import fs from "fs";

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

      // Generar hashes sin guardar
      const fileHashes = await Promise.all(
        files.map(async (file) => {
          const fileType = "image";

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
      if (fileHashes.length > 0) {
        await BackupHash.insertMany(fileHashes);
      }

      await UserHash.findOneAndUpdate(
        { userId },
        {
          $push: {
            imageHashes: {
              $each: fileHashes.filter((f) => f.fileType === "image"),
            },
            videoHashes: {
              $each: fileHashes.filter((f) => f.fileType === "video"),
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
        })),
      });
    } catch (error) {
      console.error("Error al subir archivos:", error);
      res.status(500).json({ message: "Error al subir archivos", error });
    }
  }
);

// 🔹 **Ruta exclusiva para videos**
const videosUpload = router.post(
  "/upload-videos/:userId",
  upload.array("videos"),
  copyToBackup,
  async (req, res) => {
    try {
      const userId = req.params.userId || req.body.userId;

      const files = req.files as Express.Multer.File[];

      // Generar hashes sin guardar
      const fileHashes = await Promise.all(
        files.map(async (file) => {
          const fileType = "video";

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
        // Eliminar archivos duplicados del sistema de archivos
        duplicateFiles.forEach((file) => {
          try {
            const uploadPath = path.join(
              __dirname,
              `../uploads/${userId}/${file.fileName}`
            );
            const backupPath = path.join(
              __dirname,
              `../uploadsBackup/${userId}/${file.fileName}`
            );

            if (fs.existsSync(uploadPath)) {
              fs.unlinkSync(uploadPath);
              console.log(`Archivo duplicado eliminado: ${uploadPath}`);
            }

            if (fs.existsSync(backupPath)) {
              fs.unlinkSync(backupPath);
              console.log(`Archivo duplicado eliminado: ${backupPath}`);
            }
          } catch (error) {
            console.error(
              `Error eliminando archivo duplicado: ${file.fileName}`,
              error
            );
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
      if (fileHashes.length > 0) {
        await BackupHash.insertMany(fileHashes);
      }

      await UserHash.findOneAndUpdate(
        { userId },
        {
          $push: {
            imageHashes: {
              $each: fileHashes.filter((f) => f.fileType === "image"),
            },
            videoHashes: {
              $each: fileHashes.filter((f) => f.fileType === "video"),
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
        })),
      });
    } catch (error) {
      console.error("Error al subir archivos:", error);
      res.status(500).json({ message: "Error al subir archivos", error });
    }
  }
);

export { publicacionesUpload, videosUpload };
