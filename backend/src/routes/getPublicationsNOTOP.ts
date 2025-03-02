import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

const getPublicationsNOTOP = async (req: Request, res: Response) => {
  try {
    const publicationsNOTOP = await Publicacion.find({
      status: false,
      transactionId: { $exists: false }, // Asegura que transactionId NO EXISTA
      estado: { $ne: "PENDIENTE" },
    });
    res.status(200).json(publicationsNOTOP);
  } catch (error) {
    console.error("Error al obtener las publicaciones:", error);
    res.status(500).json({ error: "Error al obtener las publicaciones NOTOP" });
  }
};

export default getPublicationsNOTOP;
