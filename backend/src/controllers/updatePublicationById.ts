import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

// Controlador para actualizar una publicación
export const updatePublicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Obtener el ID de los parámetros de la ruta
    const updates = req.body; // Obtener los datos actualizados del cuerpo de la solicitud

    // Actualizar la publicación en la base de datos
    const updatedPublication = await Publicacion.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedPublication) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    // Respuesta exitosa
    res.status(200).json({
      message: "Publicación actualizada exitosamente",
      data: updatedPublication,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la publicación" });
  }
};
