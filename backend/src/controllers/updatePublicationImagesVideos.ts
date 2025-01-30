import { Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import Publicacion from "../models/publications.models";

export const updatePublicationImagesVideos = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params; // ID de la publicación a actualizar
    const { images, videos } = req.body;

    if (!images && !videos) {
      return res
        .status(400)
        .json({ message: "No se enviaron imágenes o videos." });
    }

    // Función para generar hash de imagen desde URL
    const generateImageHash = async (imageUrl: string): Promise<string> => {
      try {
        // Si la URL es relativa, completa con la URL base del servidor

        const fullUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `http://localhost:4004${imageUrl}`;

        const response = await axios.get(fullUrl, {
          responseType: "arraybuffer",
        });
        return crypto.createHash("md5").update(response.data).digest("hex");
      } catch (error) {
        console.error("Error generando hash", error);
        return "";
      }
    };

    // Generar hashes para imágenes
    const imagesWithHashes = await Promise.all(
      images.map(async (img: { url: string; filename: string }) => ({
        url: img.url,
        filename: img.filename,
        isPrincipal: false,
        hash: await generateImageHash(img.url),
      }))
    );

    const updatedPublication = await Publicacion.findByIdAndUpdate(
      id,
      {
        $push: {
          ...(images && {
            images: { $each: imagesWithHashes },
          }),
          ...(videos && { videos: { $each: videos } }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedPublication) {
      console.log("Publicación no encontrada.");
      return res.status(404).json({ message: "Publicación no encontrada." });
    }

    res.json(updatedPublication);
  } catch (error) {
    console.error("Error en la actualización:", error);
    res.status(500).json({ message: "Error al actualizar la publicación." });
  }
};
