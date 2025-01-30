import express from "express";
import { upload, copyToBackup } from "../middleware/upload";
import { FileHashService } from "../services/fileHashService";
import { BackupHash, UserHash } from "../models/hashImagesVideos";

const router = express.Router();
const fileHashService = new FileHashService();

// Ruta para manejar la carga de archivos
const publicacionesUpload = router.post(
  "/upload/:userId",
  upload.array("files"),
  copyToBackup, // Copia los archivos a la carpeta de respaldo
  async (req, res) => {
    try {
      const userId = req.body.userId;

      if (!req.files) {
        return res.status(400).json({ message: "No se han subido archivos" });
      }

      // Accede a la lista de archivos subidos
      const files = req.files as Express.Multer.File[];

      // Generar hashes para los archivos
      const hashesPromises = files.map(async (file) => {
        const fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        return await fileHashService.generateFileHash(
          file.path,
          file.filename,
          fileType
        );
      });

      // Guardar hashes en la colección del usuario
      await UserHash.findOneAndUpdate(
        { userId },
        {
          $push: {
            hashes: { $each: await Promise.all(hashesPromises) },
          },
        },
        { upsert: true } // Crear el documento si no existe
      );

      // Guardar hashes en la base de datos
      await BackupHash.insertMany(await Promise.all(hashesPromises));

      // Crear un array con las rutas de los archivos
      const filePaths = files.map((file) => ({
        url: `/uploads/${userId}/${file.filename}`,
        filename: file.filename,
      }));

      res.status(200).json({
        message: "Archivos subidos correctamente",
        files: filePaths,
      });
    } catch (error) {
      res.status(500).json({ message: "Error al subir archivos", error });
    }
  }
);

//   RUTA PARA LOS VIDEOS

const videosUpload = router.post(
  "/upload-videos/:userId",
  upload.array("videos"),
  copyToBackup,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      if (!req.files) {
        return res.status(400).json({ message: "No se han subido videos" });
      }

      const files = req.files as Express.Multer.File[];

      // Generar hashes para los archivos
      const hashesPromises = files.map(async (file) => {
        const fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        return await fileHashService.generateFileHash(
          file.path,
          file.filename,
          fileType
        );
      });

      // Guardar hashes en la colección del usuario
      await UserHash.findOneAndUpdate(
        { userId },
        {
          $push: {
            hashes: { $each: await Promise.all(hashesPromises) },
          },
        },
        { upsert: true } // Crear el documento si no existe
      );

      // Guardar hashes en la base de datos
      await BackupHash.insertMany(await Promise.all(hashesPromises));

      const videoPaths = files.map((file) => ({
        url: `/uploads/${userId}/${file.filename}`,
        filename: file.filename,
      }));

      res.status(200).json({
        message: "Videos subidos correctamente",
        files: videoPaths,
      });
    } catch (error) {
      res.status(500).json({ message: "Error al subir videos", error });
    }
  }
);

export { publicacionesUpload, videosUpload };
