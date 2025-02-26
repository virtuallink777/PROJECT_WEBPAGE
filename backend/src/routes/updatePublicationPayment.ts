// updatePublicationPayment.js

import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

export const updatePublicationPayment = async (req: Request, res: Response) => {
  try {
    console.log("📩 Datos recibidos en el backend:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No se han recibido datos" });
    }

    const { id } = req.params; // Obtener el ID de los parámetros de la ruta

    const publication = await Publicacion.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!publication) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    // Procesar los datos de req.body
    return res.status(200).json({ message: "Datos recibidos correctamente" });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res
      .status(500)
      .json({ message: "Error al procesar el pago de la publicación" });
  }
};
