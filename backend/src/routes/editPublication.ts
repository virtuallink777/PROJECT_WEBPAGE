import { Request, Response } from "express";
import Publicacion from "../models/publications.models"; // Asegúrate de que este sea el modelo correcto

// Controlador para obtener una publicación por ID
const getPublicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Obtener el ID de los parámetros de la ruta

    // Buscar la publicación en la base de datos
    const publication = await Publicacion.findById(id);

    if (!publication) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }
    console.log("publicacion encontrada: ", publication);

    // Retornar la publicación encontrada
    res.status(200).json(publication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la publicación" });
  }
};

export { getPublicationById };
