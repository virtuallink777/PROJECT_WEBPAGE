import { Request, Response } from "express";
// Solo importa el modelo por defecto
import PublicacionModel from "../models/publications.models"; // Renombré a PublicacionModel para evitar confusión
import { UserHash } from "../models/hashImagesVideos";
import cloudinary from "../utils/cloudinary";

// --- Definimos interfaces aquí para mayor claridad y control ---

// Interfaz para los subdocumentos de imagen dentro de Publicacion
interface PublicacionImage {
  _id?: any; // o Types.ObjectId si importas de mongoose
  url: string;
  originalFilename: string;
  filename: string; // El que Cloudinary genera
  isPrincipal?: boolean;
  // ... cualquier otro campo que tengan tus imágenes
}

// Interfaz para los subdocumentos de video dentro de Publicacion
interface PublicacionVideo {
  _id?: any;
  url: string;
  originalFilename: string;
  filename: string; // El que Cloudinary genera
  // ... cualquier otro campo
}

// Interfaz para el documento Publicacion completo (lo que esperas de la DB)
// DEBE COINCIDIR con la estructura de tu modelo Publicacion.
interface IPublicacionDoc {
  _id: any; // o Types.ObjectId
  userId: string; // Asegúrate que este tipo sea correcto
  images: PublicacionImage[];
  videos: PublicacionVideo[];
  // ... todos los demás campos de tu modelo Publicacion (nombre, edad, etc.)
}

// getPublicIdFromUrl permanece igual
const getPublicIdFromUrl = (cloudinaryUrl: string): string | null => {
  // ... (código sin cambios)
  try {
    const url = new URL(cloudinaryUrl);
    const pathParts = url.pathname.split("/");
    let startIndex = pathParts.findIndex(
      (part) =>
        part === "upload" ||
        part === "fetch" ||
        part === "private" ||
        part === "authenticated"
    );

    if (startIndex === -1) {
      console.warn(
        `Delivery type (upload/fetch etc.) no encontrado en la URL: ${cloudinaryUrl}`
      );
      return null;
    }
    if (
      pathParts[startIndex + 1] &&
      pathParts[startIndex + 1].startsWith("v") &&
      /v\d+/.test(pathParts[startIndex + 1])
    ) {
      startIndex++;
    }
    const publicIdWithExtension = pathParts.slice(startIndex + 1).join("/");
    if (!publicIdWithExtension) {
      console.warn(
        `No se pudo extraer publicIdWithExtension de la URL: ${cloudinaryUrl}`
      );
      return null;
    }
    const lastDotIndex = publicIdWithExtension.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return publicIdWithExtension;
    }
    return publicIdWithExtension.substring(0, lastDotIndex);
  } catch (error) {
    console.error(
      `Error al parsear la URL de Cloudinary: ${cloudinaryUrl}`,
      error
    );
    return null;
  }
};

const deletePublications = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ message: "Falta el ID de la publicidad" });
    }

    // Usamos el tipo IPublicacionDoc con .lean()
    const publicacion = await PublicacionModel.findById(
      id
    ).lean<IPublicacionDoc>();

    if (!publicacion) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    const imagePublicIdsToDelete: string[] = [];
    const videoPublicIdsToDelete: string[] = [];
    const filenamesForUserHash: string[] = [];

    // Ahora `publicacion.images` es de tipo PublicacionImage[]
    if (publicacion.images && publicacion.images.length > 0) {
      publicacion.images.forEach((image: PublicacionImage) => {
        // `image.url` ahora es directamente un string debido a .lean() y el tipado.
        // La conversión explícita String(image.url) no debería ser necesaria
        // si IPublicacionDoc y PublicacionImage están bien definidos.
        if (image.url) {
          const publicId = getPublicIdFromUrl(image.url); // Debería funcionar
          if (publicId) {
            imagePublicIdsToDelete.push(publicId);
          } else {
            console.warn(
              `No se pudo obtener public_id para la imagen URL: ${image.url}`
            );
          }
        }
        if (image.originalFilename) {
          filenamesForUserHash.push(image.originalFilename);
        } else {
          console.warn(
            `originalFilename no encontrado para imagen. URL: ${
              image.url || "N/A"
            }`
          );
        }
      });
    }

    // Ahora `publicacion.videos` es de tipo PublicacionVideo[]
    if (publicacion.videos && publicacion.videos.length > 0) {
      publicacion.videos.forEach((video: PublicacionVideo) => {
        if (video.url) {
          const publicId = getPublicIdFromUrl(video.url); // Debería funcionar
          if (publicId) {
            videoPublicIdsToDelete.push(publicId);
          } else {
            console.warn(
              `No se pudo obtener public_id para el video URL: ${video.url}`
            );
          }
        }
        if (video.originalFilename) {
          filenamesForUserHash.push(video.originalFilename);
        } else {
          console.warn(
            `originalFilename no encontrado para video. URL: ${
              video.url || "N/A"
            }`
          );
        }
      });
    }

    // ... (resto del código para Cloudinary, UserHash, y eliminación de Publicacion) ...
    const cloudinaryDeletionPromises: Promise<any>[] = [];
    if (imagePublicIdsToDelete.length > 0) {
      console.log(
        "Intentando eliminar imágenes de Cloudinary:",
        imagePublicIdsToDelete
      );
      cloudinaryDeletionPromises.push(
        cloudinary.api
          .delete_resources(imagePublicIdsToDelete, {
            resource_type: "image",
            invalidate: true,
          })
          .catch((err) => {
            console.error(
              "Error al eliminar imágenes de Cloudinary:",
              imagePublicIdsToDelete,
              err
            );
          })
      );
    }
    if (videoPublicIdsToDelete.length > 0) {
      console.log(
        "Intentando eliminar videos de Cloudinary:",
        videoPublicIdsToDelete
      );
      cloudinaryDeletionPromises.push(
        cloudinary.api
          .delete_resources(videoPublicIdsToDelete, {
            resource_type: "video",
            invalidate: true,
          })
          .catch((err) => {
            console.error(
              "Error al eliminar videos de Cloudinary:",
              videoPublicIdsToDelete,
              err
            );
          })
      );
    }

    if (cloudinaryDeletionPromises.length > 0) {
      try {
        await Promise.all(cloudinaryDeletionPromises);
        console.log(
          "Operaciones de eliminación de Cloudinary completadas (o errores manejados)."
        );
      } catch (aggregateError) {
        console.error(
          "Uno o más errores ocurrieron durante la eliminación de Cloudinary:",
          aggregateError
        );
      }
    }

    if (filenamesForUserHash.length > 0) {
      console.log(
        "Intentando eliminar hashes de UserHash para los siguientes filenames (DEBERÍAN SER ORIGINALES):",
        filenamesForUserHash
      );
      // Asegúrate de que publicacion.userId es un string. Si usas .lean(), debería serlo.
      // Si no, podrías necesitar publicacion.userId.toString() si userId fuera un ObjectId.
      // Pero tu interfaz IPublicacionDoc ya lo define como string.
      const updateResult = await UserHash.updateOne(
        { userId: publicacion.userId }, // userId debe ser string aquí
        {
          $pull: {
            imageFiles: { fileName: { $in: filenamesForUserHash } },
            videoFiles: { fileName: { $in: filenamesForUserHash } },
          },
        }
      );
      console.log("Resultado de UserHash.updateOne:", updateResult);
      console.log("Hashes eliminados/intentados eliminar de UserHash.");
    } else {
      console.log(
        "No se encontraron originalFilenames para eliminar hashes de UserHash."
      );
    }

    await PublicacionModel.findByIdAndDelete(id); // Usar PublicacionModel
    console.log("Publicación eliminada de la base de datos.");

    res.status(200).json({
      message:
        "Publicación eliminada exitosamente (archivos de Cloudinary se intentaron eliminar)",
    });
  } catch (error) {
    console.error("Error general al eliminar la publicación:", error);
    res.status(500).json({ message: "Error al eliminar la publicación" });
  }
};

export default deletePublications;
