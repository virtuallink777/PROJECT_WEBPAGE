import { Request, Response } from "express";

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

    const updatedPublication = await Publicacion.findByIdAndUpdate(
      id,
      {
        $push: {
          ...(images && {
            images: {
              $each: images.map((img: { url: string; filename: string }) => ({
                url: img.url,
                filename: img.filename,
                isPrincipal: false,
              })),
            },
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
