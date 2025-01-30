import { Request, Response } from "express";
import Publicacion from "../models/publications.models";
import fs from "fs";
import path from "path";
import { ImageHashUser } from "../models/imageHashesGlobalAndUser";

// Controlador para actualizar una publicación
export const updatePublicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Obtener el ID de los parámetros de la ruta
    const updates = req.body; // Obtener los datos actualizados del cuerpo de la solicitud

    console.log(updates);

    // Obtener la publicación actual antes de actualizar
    const existingPublication = await Publicacion.findById(id);
    if (!existingPublication) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    const userId = existingPublication.userId.toString();
    const existingImages = existingPublication.images.map(
      (img) => img.filename
    );
    const newImages = updates.images
      ? updates.images.map((img: any) => img.filename)
      : [];
    const imagesToDelete = existingImages.filter(
      (img) => !newImages.includes(img)
    );

    //funcion para eliminar videos
    const existingVideos = existingPublication.videos.map(
      (video) => video.filename
    );

    const newVideos = updates.videos
      ? updates.videos.map((video: any) => video.filename)
      : [];
    const videosToDelete = existingVideos.filter(
      (video) => !newVideos.includes(video)
    );

    // Eliminar archivos físicos de `/uploads/${userId}`

    for (const filename of imagesToDelete) {
      // Ruta de la imagen en el sistema
      const filePath = path.join(__dirname, `../uploads/${userId}/${filename}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Eliminar archivo físico
        console.log(`Imagen eliminada: ${filePath}`);
      }
    }

    for (const filename of videosToDelete) {
      // Ruta de la imagen en el sistema
      const filePath = path.join(__dirname, `../uploads/${userId}/${filename}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Eliminar archivo fisico
        console.log(`Video eliminado: ${filePath}`);
      }
    }

    // Actualizar la publicación en la base de datos
    const updatedPublication = await Publicacion.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    res.status(200).json({
      message: "Publicación actualizada exitosamente",
      data: updatedPublication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la publicación" });
  }
};
