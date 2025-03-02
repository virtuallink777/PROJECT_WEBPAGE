import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

const getPublicationsTOP = async (req: Request, res: Response) => {
  try {
    const publications = await Publicacion.find({
      status: true,
      transactionId: { $exists: true, $ne: null }, // Asegura que transactionId exista y no sea null
    });
    res.status(200).json(publications);
  } catch (error) {
    console.error("Error al obtener las publicaciones TOP:", error);
    res.status(500).json({ error: "Error al obtener las publicaciones TOP" });
  }
};

export default getPublicationsTOP;
