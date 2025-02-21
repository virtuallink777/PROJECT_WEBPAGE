import express from "express";
import { Request, Response } from "express";
const router = express.Router();
import Publicacion from "../models/publications.models";

const statePublications = async (req: Request, res: Response) => {
  const { id, estado, razon } = req.body;

  // Validar que el estado sea uno de los permitidos

  const allowedStates = ["PENDIENTE", "APROBADA", "RECHAZADA"];
  if (!allowedStates.includes(estado)) {
    return res.status(400).json({ message: "Estado no permitido" });
  }

  try {
    // Buscar la publicación por ID y actualizar el estado y la razón de rechazo
    const publication = await Publicacion.findByIdAndUpdate(
      id,
      { estado, razon },
      { new: true }
    ); // Devuelve la publicación actualizada
    if (!publication) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }
    res.status(200).json(publication);
  } catch (error) {
    console.error("Error al actualizar la publicación:", error);
    res.status(500).json({ error: "Error al actualizar la publicación" });
  }
};

export default statePublications;
