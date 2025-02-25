import express from "express";
import { Request, Response } from "express";
import Publicacion from "../models/publications.models";
import fs from "fs";
import path from "path";
import { UserHash } from "../models/hashImagesVideos";

const deleteFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deletePublications = async (req: Request, res: Response) => {
  try {
    // primero buscamos la publicidad
    const { id } = req.body; // Obteniendo el ID del body
    if (!id) {
      return res.status(400).json({ message: "Falta el ID de la publicidad" });
    }

    // 2️⃣ Buscar la publicación en la base de datos
    const publicacion = await Publicacion.findById(id);
    if (!publicacion) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    // Obtener los archivos eliminados (imágenes y videos)
    const archivosEliminados: string[] = [];

    // 🔹 Recorrer todas las imágenes de la publicación

    publicacion.images.forEach((image) => {
      const filePath = path.join(
        __dirname,
        `../uploads/${publicacion.userId}/${image.filename}`
      );
      deleteFile(filePath);
      archivosEliminados.push(image.filename);
    });

    // 🔹 Recorrer todos los videos de la publicación

    publicacion.videos.forEach((video) => {
      const filePath = path.join(
        __dirname,
        `../uploads/${publicacion.userId}/${video.filename}`
      );
      deleteFile(filePath);
      archivosEliminados.push(video.filename);
    });

    // 4️⃣ Eliminar los hashes de la base de datos
    await UserHash.updateOne(
      { userId: publicacion.userId },
      {
        $pull: {
          imageHashes: { fileName: { $in: archivosEliminados } },
          videoHashes: { fileName: { $in: archivosEliminados } },
        },
      }
    );

    // 5️⃣ Eliminar la publicación de la base de datos

    await Publicacion.findByIdAndDelete(id);

    res.status(200).json({ message: "Publicación eliminada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar la publicación" });
  }
};

export default deletePublications;
