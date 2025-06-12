import { Request, Response } from "express";
import PublicacionModel from "../models/publications.models"; // Asumo que este es el nombre correcto de tu modelo
import { UserHash } from "../models/hashImagesVideos";
import cloudinary from "../utils/cloudinary";

// --- Tus Interfaces (IPublication, etc.) ---
// (Asegúrate de que estas interfaces coincidan con la estructura de tus datos,
// especialmente los subdocumentos de images/videos y lo que esperas de 'updates')
interface PublicacionImage {
  _id: any;
  url: string;
  isPrincipal?: boolean;
  filename: string;
  originalFilename: string;
}

interface PublicacionVideo {
  _id: any;
  url: string;
  filename: string;
  originalFilename: string;
}

interface IPublicacionDoc {
  _id: any;
  userId: string;
  images: PublicacionImage[];
  videos: PublicacionVideo[];
  // ... otros campos
}

// --- Tu función getPublicIdFromUrl (sin cambios) ---
const getPublicIdFromUrl = (cloudinaryUrl: string): string | null => {
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
        `[getPublicIdFromUrl] Delivery type no encontrado en URL: ${cloudinaryUrl}`
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
        `[getPublicIdFromUrl] No se pudo extraer publicIdWithExtension de: ${cloudinaryUrl}`
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
      `[getPublicIdFromUrl] Error al parsear URL: ${cloudinaryUrl}`,
      error
    );
    return null;
  }
};

export const updatePublicationById = async (req: Request, res: Response) => {
  // Log #0 - ¿Se llama la función?
  process.stdout.write(
    `\n>>> LOG #0: updatePublicationById - FUNCION LLAMADA - Timestamp: ${new Date().toISOString()}\n`
  );

  // Log #1 - ¿Tenemos req.body?
  let requestBodyForLog: string;
  try {
    requestBodyForLog = JSON.stringify(req.body, null, 2);
    process.stdout.write(
      `>>> LOG #1: updatePublicationById - Payload 'updates' recibido:\n${requestBodyForLog}\n`
    );
  } catch (e) {
    process.stdout.write(
      `>>> LOG #1: updatePublicationById - ERROR AL STRINGIFY req.body: ${
        (e as Error).message
      }\n`
    );
    // Si esto falla, es un problema con el cuerpo de la petición
    return res.status(400).json({ message: "Cuerpo de la petición inválido." });
  }

  try {
    // Log #2 - ¿Tenemos req.params?
    process.stdout.write(
      `>>> LOG #2: updatePublicationById - req.params: ${JSON.stringify(
        req.params
      )}\n`
    );

    if (!req.params || typeof req.params.id === "undefined") {
      process.stdout.write(
        ">>> LOG #2.1: updatePublicationById - ERROR: req.params o req.params.id es undefined.\n"
      );
      return res.status(400).json({
        message: "Falta el ID de la publicación en la ruta (params).",
      });
    }

    const { id: publicationId } = req.params;
    const updates = req.body; // Ya sabemos que req.body existe si llegamos aquí

    // Log #3 - ¿Se extrajo publicationId?
    process.stdout.write(
      `>>> LOG #3: updatePublicationById - publicationId extraído: ${publicationId}\n`
    );

    if (!publicationId) {
      process.stdout.write(
        ">>> LOG #3.1: updatePublicationById - ERROR: publicationId es falsy después de la desestructuración.\n"
      );
      return res
        .status(400)
        .json({ message: "Falta el ID de la publicación." });
    }

    // Log #4 - Antes de la primera operación async (findById)
    process.stdout.write(
      `>>> LOG #4: updatePublicationById - Antes de PublicacionModel.findById para ID: ${publicationId}\n`
    );
    const existingPublication = await PublicacionModel.findById(
      publicationId
    ).lean<IPublicacionDoc>();
    process.stdout.write(
      `>>> LOG #5: updatePublicationById - Después de PublicacionModel.findById. Encontrado: ${!!existingPublication}\n`
    );

    if (!existingPublication) {
      process.stdout.write(
        `>>> LOG #5.1: updatePublicationById - ERROR: Publicación no encontrada con ID: ${publicationId}\n`
      );
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    // SI LLEGAMOS HASTA AQUÍ, LA PARTE INICIAL FUNCIONA.
    // Ahora la lógica de eliminación... (simplificada para probar solo Cloudinary por ahora)
    process.stdout.write(
      ">>> LOG #6: updatePublicationById - Iniciando lógica de identificación de archivos a eliminar.\n"
    );

    // <<< CAMBIO: Unificar la lógica de borrado >>>
    const filesToDelete = {
      images: {
        cloudinaryPublicIds: [] as string[],
        originalFilenames: [] as string[],
      },
      videos: {
        cloudinaryPublicIds: [] as string[],
        originalFilenames: [] as string[],
      },
    };

    // --- Lógica para IMÁGENES a eliminar ---
    if (updates.images !== undefined && Array.isArray(updates.images)) {
      const idsOfImagesToKeep = updates.images.map((img: { _id: any }) =>
        img._id.toString()
      );

      existingPublication.images?.forEach((existingImage) => {
        if (!idsOfImagesToKeep.includes(existingImage._id.toString())) {
          const publicId = getPublicIdFromUrl(existingImage.url);
          if (publicId) {
            filesToDelete.images.cloudinaryPublicIds.push(publicId);
          }
          if (existingImage.originalFilename) {
            filesToDelete.images.originalFilenames.push(
              existingImage.originalFilename
            );
          }
        }
      });
    }

    // <<< CAMBIO: Añadir lógica para VIDEOS a eliminar >>>
    if (updates.videos !== undefined && Array.isArray(updates.videos)) {
      const idsOfVideosToKeep = updates.videos.map((vid: { _id: any }) =>
        vid._id.toString()
      );

      existingPublication.videos?.forEach((existingVideo) => {
        if (!idsOfVideosToKeep.includes(existingVideo._id.toString())) {
          const publicId = getPublicIdFromUrl(existingVideo.url);
          if (publicId) {
            // Importante: los videos también tienen public_id
            filesToDelete.videos.cloudinaryPublicIds.push(publicId);
          }
          if (existingVideo.originalFilename) {
            // El mismo array puede contener filenames de imágenes y videos
            filesToDelete.videos.originalFilenames.push(
              existingVideo.originalFilename
            );
          }
        }
      });
    }
    // Logs mejorados
    process.stdout.write(
      `>>> LOG #7: updatePublicationById - IDs de IMÁGENES para eliminar de Cloudinary: ${filesToDelete.images.cloudinaryPublicIds.join(
        ", "
      )}\n`
    );
    process.stdout.write(
      `>>> LOG #7.1: updatePublicationById - IDs de VIDEOS para eliminar de Cloudinary: ${filesToDelete.videos.cloudinaryPublicIds.join(
        ", "
      )}\n`
    );

    const allOriginalFilenamesToDelete = [
      ...filesToDelete.images.originalFilenames,
      ...filesToDelete.videos.originalFilenames,
    ];
    process.stdout.write(
      `>>> LOG #7.2: updatePublicationById - originalFilenames (total) para eliminar de UserHash: ${allOriginalFilenamesToDelete.join(
        ", "
      )}\n`
    );

    // --- Sección de Cloudinary ---
    // Eliminar IMÁGENES
    if (filesToDelete.images.cloudinaryPublicIds.length > 0) {
      process.stdout.write(
        ">>> LOG #8.1: updatePublicationById - Intentando eliminar IMÁGENES de Cloudinary.\n"
      );
      try {
        const result = await cloudinary.api.delete_resources(
          filesToDelete.images.cloudinaryPublicIds,
          {
            resource_type: "image",
            invalidate: true,
          }
        );
        process.stdout.write(
          `>>> LOG #9.1: updatePublicationById - Resultado de Cloudinary (imágenes): ${JSON.stringify(
            result
          )}\n`
        );
      } catch (error) {
        console.error("Error al eliminar imágenes de Cloudinary:", error);
      }
    }

    // <<< CAMBIO: Eliminar VIDEOS de Cloudinary >>>
    if (filesToDelete.videos.cloudinaryPublicIds.length > 0) {
      process.stdout.write(
        ">>> LOG #8.2: updatePublicationById - Intentando eliminar VIDEOS de Cloudinary.\n"
      );
      try {
        const result = await cloudinary.api.delete_resources(
          filesToDelete.videos.cloudinaryPublicIds,
          {
            // La clave es el resource_type
            resource_type: "video",
            invalidate: true,
          }
        );
        process.stdout.write(
          `>>> LOG #9.2: updatePublicationById - Resultado de Cloudinary (videos): ${JSON.stringify(
            result
          )}\n`
        );
      } catch (error) {
        console.error("Error al eliminar videos de Cloudinary:", error);
      }
    }

    // --- Sección de UserHash ---
    if (allOriginalFilenamesToDelete.length > 0) {
      process.stdout.write(
        ">>> LOG #10: updatePublicationById - Intentando eliminar de UserHash.\n"
      );
      try {
        // <<< CAMBIO: Query unificada y correcta >>>
        // Asegúrate de que los campos en tu schema UserHash sean `fileName`.
        const userHashResult = await UserHash.updateOne(
          { userId: existingPublication.userId },
          {
            $pull: {
              imageFiles: { fileName: { $in: allOriginalFilenamesToDelete } },
              videoFiles: { fileName: { $in: allOriginalFilenamesToDelete } },
            },
          }
        );
        process.stdout.write(
          `>>> LOG #11: updatePublicationById - Resultado de UserHash updateOne: ${JSON.stringify(
            userHashResult
          )}\n`
        );
      } catch (userHashError) {
        process.stdout.write(
          `>>> LOG #11.1: updatePublicationById - ERROR en UserHash updateOne: ${
            (userHashError as Error).message
          }\n`
        );
      }
    } else {
      process.stdout.write(
        ">>> LOG #10: updatePublicationById - No hay hashes para eliminar de UserHash.\n"
      );
    }

    // --- Actualizar MongoDB ---
    process.stdout.write(
      ">>> LOG #12: updatePublicationById - Intentando actualizar MongoDB.\n"
    );
    const updatedPublication = await PublicacionModel.findByIdAndUpdate(
      publicationId,
      { $set: updates },
      { new: true }
    ).lean<IPublicacionDoc>();
    process.stdout.write(
      `>>> LOG #13: updatePublicationById - Después de MongoDB update. Encontrado: ${!!updatedPublication}\n`
    );

    if (!updatedPublication) {
      return res.status(404).json({
        message:
          "No se pudo actualizar o encontrar la publicación después de la operación.",
      });
    }

    res.status(200).json({
      message: "Publicación actualizada correctamente",
      data: updatedPublication,
    });
  } catch (error) {
    // ... tu bloque catch ...
    console.error(
      "--- ERROR GENERAL DETALLADO en updatePublicationById ---:",
      error
    );
    res.status(500).json({
      message: "Error al actualizar la publicación",
      errorDetails: error instanceof Error ? error.message : String(error),
    });
  }
};
