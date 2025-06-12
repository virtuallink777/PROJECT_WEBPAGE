// En publicacionesUpload.ts
import express from "express";
import { upload } from "../middleware/upload";
import { UserHash } from "../models/hashImagesVideos";
import cloudinary from "../utils/cloudinary"; // Este es tu SDK configurado
import {
  FileHashService,
  GeneratedHashInfo,
} from "../services/fileHashService"; // Importa el servicio y la interfaz
import Publicacion from "../models/publications.models";

const router = express.Router();
const fileHashService = new FileHashService(); // Crea una instancia

interface CloudinaryMulterFile extends Express.Multer.File {
  /* ... */
}

const ImagesVideosUpload = router.post(
  "/upload/:userId",
  upload.array("files"),
  async (req, res) => {
    try {
      const userId = req.params.userId || req.body.userId;
      const id = req.params.id || req.body.id;
      // ... (validación de req.files) ...

      // Obtener publicationId, ya sea de params o body
      const publicationId = req.params.id || req.body.id; // <--- OBTENER PUBLICATION ID

      if (!publicationId) {
        return res
          .status(400)
          .json({ message: "Falta el ID de la publicación a actualizar." });
      }

      console.log("ID de publicación recibido:", publicationId);

      const filesFromCloudinary = req.files as CloudinaryMulterFile[];

      if (!filesFromCloudinary || filesFromCloudinary.length === 0) {
        return res.status(400).json({ message: "No se subieron archivos." });
      }

      console.log(
        "Archivos subidos a Cloudinary:",
        filesFromCloudinary.map((f) => ({ o: f.originalname, url: f.path }))
      );

      // ----- PASO 2 (REVISADO OTRA VEZ): Usar FileHashService -----
      const processedFileDataPromises = filesFromCloudinary.map(
        async (file) => {
          try {
            const fileType = file.mimetype.startsWith("video/")
              ? "video"
              : "image";

            // Usar FileHashService para generar el hash desde la URL de Cloudinary
            const hashInfo: GeneratedHashInfo =
              await fileHashService.generateFileHash(
                file.path, // URL del archivo en Cloudinary
                file.originalname,
                fileType
              );

            return {
              hash: hashInfo.hash, // Hash generado por tu servicio
              fileName: file.originalname, // o hashInfo.fileName, que debería ser originalname
              fileType: fileType, // o hashInfo.fileType
              cloudinaryUrl: file.path,
              cloudinaryPublicId: file.filename,
              mimetype: file.mimetype,
            };
          } catch (hashError) {
            console.error(
              `Error al generar hash para ${file.originalname}:`,
              hashError
            );
            throw new Error(
              `Fallo al generar hash para el archivo ${file.originalname}.`
            );
          }
        }
      );

      const processedFileData = await Promise.all(processedFileDataPromises);
      console.log(
        "Datos de archivos procesados (con hashes SHA256):",
        processedFileData
      );

      // ----- PASO 3 en adelante: La lógica de duplicados, guardado, etc., se mantiene igual -----
      // Usarás 'processedFileData' que ahora tiene el 'hash' (ETag de la API).

      const userDoc = await UserHash.findOne({ userId });

      const userDuplicateFiles = processedFileData.filter(
        (pf) =>
          userDoc?.imageFiles.some((img) => img.hash === pf.hash) ||
          userDoc?.videoFiles.some((vid) => vid.hash === pf.hash)
      );

      const userDuplicateFilesExport = userDuplicateFiles.map((pf) => {
        const existingImg = userDoc?.imageFiles.find(
          (img) => img.hash === pf.hash
        );
        const existingVid = userDoc?.videoFiles.find(
          (vid) => vid.hash === pf.hash
        );
        return {
          filename:
            existingImg?.fileName || existingVid?.fileName || pf.fileName,
          filePath:
            existingImg?.cloudinaryUrl ||
            existingVid?.cloudinaryUrl ||
            pf.cloudinaryUrl,
        };
      });
      if (userDuplicateFiles.length > 0) {
        console.log(
          "Archivos duplicados para el usuario actual:",
          userDuplicateFilesExport
        );
      }

      const globalDuplicateDocs = await UserHash.find({
        $or: [
          {
            "imageFiles.hash": { $in: processedFileData.map((pf) => pf.hash) },
          },
          {
            "videoFiles.hash": { $in: processedFileData.map((pf) => pf.hash) },
          },
        ],
        userId: { $ne: userId },
      }).select("userId imageFiles videoFiles");

      const globalDuplicatesExport = globalDuplicateDocs.flatMap((doc) =>
        processedFileData
          .map((pf) => {
            const imgMatch = doc.imageFiles.find((img) => img.hash === pf.hash);
            if (imgMatch)
              return {
                filename: imgMatch.fileName,
                filePath: imgMatch.cloudinaryUrl,
                owner: doc.userId.toString(),
              }; // Convertir ObjectId a string si userId es ObjectId

            const vidMatch = doc.videoFiles.find((vid) => vid.hash === pf.hash);
            if (vidMatch)
              return {
                filename: vidMatch.fileName,
                filePath: vidMatch.cloudinaryUrl,
                owner: doc.userId.toString(),
              };

            return null;
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
      ) as { filename: string; filePath: string; owner: string }[];
      if (globalDuplicatesExport.length > 0) {
        console.log(
          "Archivos duplicados en otros usuarios:",
          globalDuplicatesExport
        );
      }

      if (userDuplicateFiles.length > 0 || globalDuplicatesExport.length > 0) {
        const isUserDuplicate = userDuplicateFiles.length > 0;
        // ... (Lógica de eliminación de Cloudinary)
        const message = isUserDuplicate
          ? "Se detectaron archivos duplicados para este usuario."
          : "Se detectaron archivos duplicados en otros usuarios.";
        console.log(
          message +
            " Procediendo a eliminar los archivos recién subidos de Cloudinary."
        );

        for (const pf of processedFileData) {
          try {
            // pf.fileType ya es 'image' o 'video'
            await cloudinary.uploader.destroy(pf.cloudinaryPublicId, {
              resource_type: pf.fileType,
            });
            console.log(
              `Archivo ${pf.cloudinaryPublicId} eliminado de Cloudinary.`
            );
          } catch (deleteError) {
            console.error(
              `Error eliminando ${pf.cloudinaryPublicId} de Cloudinary:`,
              deleteError
            );
          }
        }
        return res.status(400).json({
          message: message + " No se guardó ningún archivo nuevo.",
          duplicateFiles: isUserDuplicate
            ? userDuplicateFilesExport
            : globalDuplicatesExport,
        });
      }

      await UserHash.findOneAndUpdate(
        { userId },
        {
          $addToSet: {
            imageFiles: {
              $each: processedFileData
                .filter((pf) => pf.fileType === "image")
                .map((pf) => ({
                  /* ...datos completos... */ hash: pf.hash,
                  fileName: pf.fileName,
                  cloudinaryUrl: pf.cloudinaryUrl,
                  cloudinaryPublicId: pf.cloudinaryPublicId,
                  fileType: pf.fileType,
                })),
            },
            videoFiles: {
              $each: processedFileData
                .filter((pf) => pf.fileType === "video")
                .map((pf) => ({
                  /* ...datos completos... */ hash: pf.hash,
                  fileName: pf.fileName,
                  cloudinaryUrl: pf.cloudinaryUrl,
                  cloudinaryPublicId: pf.cloudinaryPublicId,
                  fileType: pf.fileType,
                })),
            },
          },
        },
        { upsert: true, new: true }
      );

      console.log(
        "Archivos guardados/actualizados en MongoDB para el usuario:",
        userId
      );

      // ----- NUEVO PASO 5: Actualizar PublicacionModel con las nuevas URLs -----

      const newImagesForPublicacion = processedFileData
        .filter((pf) => pf.fileType === "image")
        .map((pf) => ({
          url: pf.cloudinaryUrl,
          isPrincipal: false, // Asignar isPrincipal según tu lógica
          filename: pf.fileName,
          originalFilename: pf.fileName, // Asegúrate de que este campo exista en tu modelo
        }));

      const newVideosForPublicacion = processedFileData
        .filter((pf) => pf.fileType === "video")
        .map((pf) => ({
          url: pf.cloudinaryUrl,
          filename: pf.fileName,
          originalFilename: pf.fileName, // Asegúrate de que este campo exista en tu modelo
        }));

      if (
        newImagesForPublicacion.length === 0 &&
        newVideosForPublicacion.length === 0
      ) {
        return res.status(400).json({
          message:
            "No se encontraron archivos para actualizar en la publicación.",
        });
      }

      const updatedPublication = await Publicacion.findByIdAndUpdate(
        publicationId,
        {
          $push: {
            images: {
              $each: newImagesForPublicacion,
            },
            videos: {
              $each: newVideosForPublicacion,
            },
          },
        },
        { new: true }
      );

      if (!updatedPublication) {
        console.error(
          `Error: No se pudo encontrar o actualizar la publicación con ID: ${publicationId} después de subir archivos.`
        );
      } else {
        console.log(
          `Publicación ${publicationId} actualizada con nuevas imágenes/videos.`
        );
      }

      if (!updatedPublication) {
        return res.status(400).json({
          message:
            "No se pudo actualizar la publicación con los nuevos archivos.",
        });
      }

      res.status(200).json({
        message: "Archivos subidos y registrados exitosamente.",
        uploadedFiles: processedFileData.map((pf) => ({
          url: pf.cloudinaryUrl,
          filename: pf.fileName,
          type: pf.fileType,
          public_id: pf.cloudinaryPublicId,
        })),
      });
    } catch (error) {
      // ... (Manejo de errores y limpieza de Cloudinary)
      console.error("Error general en la ruta /upload/:userId :", error);
      if (req.files && (req.files as CloudinaryMulterFile[]).length > 0) {
        const filesToClean = req.files as CloudinaryMulterFile[];
        console.error(
          "Intentando limpiar archivos de Cloudinary debido a un error en el procesamiento..."
        );
        for (const fileToClean of filesToClean) {
          if (fileToClean.filename) {
            try {
              const resource_type = fileToClean.mimetype.startsWith("video/")
                ? "video"
                : fileToClean.mimetype.startsWith("image/")
                ? "image"
                : "raw";
              await cloudinary.uploader.destroy(fileToClean.filename, {
                resource_type,
              });
              console.log(
                `Limpieza por error: Archivo ${fileToClean.filename} eliminado de Cloudinary.`
              );
            } catch (cleanupError) {
              console.error(
                `Error en limpieza de Cloudinary para ${fileToClean.filename}:`,
                cleanupError
              );
            }
          }
        }
      }
      res.status(500).json({
        message: "Error interno del servidor al procesar archivos.",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

export default router; // Asumo que exportas el router, no la función publicacionesUpload directamente
