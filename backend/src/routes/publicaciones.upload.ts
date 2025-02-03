import express from "express";
import { upload, copyToBackup } from "../middleware/upload";
import { FileHashService } from "../services/fileHashService";
import { BackupHash, UserHash } from "../models/hashImagesVideos";

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
        return res.status(400).json({ message: "No se han subido archivos" });
      }

      const files = req.files as Express.Multer.File[];

      const hashesPromises = files.map(async (file) => {
        const fileType = file.mimetype.startsWith("image/") ? "image" : "video";
        return await fileHashService.generateFileHash(
          file.path,
          file.filename,
          fileType
        );
      });

      const fileHashes = await Promise.all(hashesPromises);
      console.log(
        "File Hashes antes de guardar:",
        JSON.stringify(fileHashes, null, 2)
      );

      if (fileHashes.some((f) => !f.fileName || !f.filePath)) {
        return res
          .status(400)
          .json({ message: "Algunos archivos tienen datos faltantes" });
      }

      // VALIDACION DE HASHES DUPLICADOS NUEVOS VS GUARDADOS EN userhashes y backupHashes

      await BackupHash.insertMany(fileHashes);

      // 🔹 **Guardar en UserHash dependiendo del tipo**
      const updateQuery: any = {};
      const imageFiles = fileHashes.filter((f) => f.fileType === "image");
      const videoFiles = fileHashes.filter((f) => f.fileType === "video");

      if (imageFiles.length > 0) {
        updateQuery.$push = { imageHashes: { $each: imageFiles } };
      }
      if (videoFiles.length > 0) {
        updateQuery.$push = { videoHashes: { $each: videoFiles } };
      }

      await UserHash.findOneAndUpdate({ userId }, updateQuery, {
        upsert: true,
        new: true,
      });

      const filePaths = files.map((file) => ({
        url: `/uploads/${userId}/${file.filename}`,
        filename: file.filename,
      }));

      res.status(200).json({
        message: "Archivos subidos correctamente",
        files: filePaths,
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
      const userId = req.params.userId;

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: "No se han subido videos" });
      }

      const files = req.files as Express.Multer.File[];

      const hashesPromises = files.map(async (file) => {
        return await fileHashService.generateFileHash(
          file.path,
          file.filename,
          "video"
        );
      });

      const fileHashes = await Promise.all(hashesPromises);
      console.log(
        "Video Hashes antes de guardar:",
        JSON.stringify(fileHashes, null, 2)
      );

      if (fileHashes.some((f) => !f.fileName || !f.filePath)) {
        return res
          .status(400)
          .json({ message: "Algunos archivos tienen datos faltantes" });
      }

      await BackupHash.insertMany(fileHashes);

      // 🔹 **Guardar solo videos en UserHash**
      await UserHash.findOneAndUpdate(
        { userId },
        { $push: { videoHashes: { $each: fileHashes } } },
        { upsert: true, new: true }
      );

      const videoPaths = files.map((file) => ({
        url: `/uploads/${userId}/${file.filename}`,
        filename: file.filename,
      }));

      res.status(200).json({
        message: "Videos subidos correctamente",
        files: videoPaths,
      });
    } catch (error) {
      console.error("Error al subir videos:", error);
      res.status(500).json({ message: "Error al subir videos", error });
    }
  }
);

export { publicacionesUpload, videosUpload };
