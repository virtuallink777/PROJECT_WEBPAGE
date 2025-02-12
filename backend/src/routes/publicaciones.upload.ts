import express from "express";
import { upload } from "../middleware/upload";
import { FileHashService } from "../services/fileHashService";
import { UserHash } from "../models/hashImagesVideos";
import path from "path";
import fs from "fs";

const router = express.Router();
const fileHashService = new FileHashService();

// 🔹 **Ruta para subir imágenes y videos (general)**
const publicacionesUpload = router.post(
  "/upload/:userId",
  upload.array("files"),

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

      //****************aca va logica para buscar en mongodb los hashes */
      const duplicateImages = existingHashes?.imageHashes.filter((img) =>
        duplicateFiles.some((f) => f.hash === img.hash)
      );
      const duplicateVideos = existingHashes?.videoHashes.filter((vid) =>
        duplicateFiles.some((f) => f.hash === vid.hash)
      );
      // combinamos resultados
      const duplicateFilesExport = [
        ...(duplicateImages?.map((img) => ({
          filename: img.fileName,
          filePath: `http://localhost:4004/uploads/${userId}/${img.fileName}`,
        })) || []),
        ...(duplicateVideos?.map((vid) => ({
          filename: vid.fileName,
          filePath: `http://localhost:4004/uploads/${userId}/${vid.fileName}`,
        })) || []),
      ];
      console.log("ARCHIVOS Duplicados para export:", duplicateFilesExport);

      // ACA VA  LA LOGICA DE BUSCAR HASHES A NIVEL GENERAL EN MONGODB PARA EL ADMIN
      // Esto busca todos los usuarios que tengan al menos uno de los hashes subidos, excluyendo al usuario actual.
      const globalDuplicateFiles = await UserHash.find({
        $or: [
          { "imageHashes.hash": { $in: fileHashes.map((f) => f.hash) } },
          { "videoHashes.hash": { $in: fileHashes.map((f) => f.hash) } },
        ],
        userId: { $ne: userId }, // Excluir al usuario actual
      }).select("userId imageHashes videoHashes");

      // Como globalDuplicateFiles contiene varios usuarios, hay que recorrerlos y extraer los archivos duplicados:
      const globalDuplicates = globalDuplicateFiles.flatMap((user) => {
        return [
          ...user.imageHashes
            .filter((img) => fileHashes.some((f) => f.hash === img.hash))
            .map((img) => ({
              filename: img.fileName,
              filePath: `http://localhost:4004/uploads/${user.userId}/${img.fileName}`,
              owner: user.userId, // mostrar quien tiene el archivo
            })),
          ...user.videoHashes
            .filter((vid) => fileHashes.some((f) => f.hash === vid.hash))
            .map((vid) => ({
              filename: vid.fileName,
              filePath: `http://localhost:4004/uploads/${user.userId}/${vid.fileName}`,
              owner: user.userId, // mostrar quien tiene el archivo
            })),
        ];
      });

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

            console.log(`Intentando eliminar archivo: ${file.filename}`);
            console.log(`Ruta de uploads: ${uploadPath}`);

            // Eliminar archivo de la carpeta de uploads
            if (fs.existsSync(uploadPath)) {
              fs.unlinkSync(uploadPath);
              console.log(`Archivo eliminado: ${uploadPath}`);
            } else {
              console.log(`El archivo no existe en uploads: ${uploadPath}`);
            }
          } catch (error) {
            console.error(`Error eliminando archivo: ${file.filename}`, error);
          }
        });

        return res.status(400).json({
          message:
            "Se detectaron archivos duplicados. No se subió ningún archivo.",
          duplicateFiles: duplicateFilesExport, // Duplicados dentro del mismo usuario
        });
      }

      if (globalDuplicates.length > 0) {
        console.log(
          `Archivos duplicados detectados en otros usuarios: ${globalDuplicates.length}`
        );
        // Eliminar TODOS los archivos subidos (duplicados y no duplicados)
        files.forEach((file) => {
          try {
            const uploadPath = path.join(
              __dirname,
              `../uploads/${userId}/${file.filename}`
            );

            console.log(`Intentando eliminar archivo: ${file.filename}`);
            console.log(`Ruta de uploads: ${uploadPath}`);

            // Eliminar archivo de la carpeta de uploads
            if (fs.existsSync(uploadPath)) {
              fs.unlinkSync(uploadPath);
              console.log(`Archivo eliminado: ${uploadPath}`);
            } else {
              console.log(`El archivo no existe en uploads: ${uploadPath}`);
            }
          } catch (error) {
            console.error(`Error eliminando archivo: ${file.filename}`, error);
          }
        });

        return res.status(400).json({
          message:
            "Se detectaron archivos duplicados en otros usuarios. No se subió ninguno.",
          duplicateFiles: globalDuplicates, // Duplicados en otros usuarios
        });
      }

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
