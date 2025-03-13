import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

const getPublicationsNOTOP = async (req: Request, res: Response) => {
  try {
    // Buscar la publicación en MongoDB
    const publicationTOP = await Publicacion.find({
      status: true,
      estado: "APROBADA",
    })
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente (más nuevo primero)
      .exec(); // Usa await y .exec()

    if (!publicationTOP) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    return res.status(200).json(publicationTOP);
  } catch (error) {
    console.error("Error al obtener la publicación:", error);
    return res.status(500).json({ message: "Error al obtener la publicación" });
  }
};

export default getPublicationsNOTOP;
