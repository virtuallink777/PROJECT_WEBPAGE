import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

const getPublicationsNOTOP = async (req: Request, res: Response) => {
  try {
    // Buscar la publicación en MongoDB
    const publicationTOPNO = await Publicacion.find({
      status: false,
      estado: "APROBADA",
    }).exec(); // Usa await y .exec()

    if (!publicationTOPNO) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    return res.status(200).json(publicationTOPNO);
  } catch (error) {
    console.error("Error al obtener la publicación:", error);
    return res.status(500).json({ message: "Error al obtener la publicación" });
  }
};

export default getPublicationsNOTOP;
