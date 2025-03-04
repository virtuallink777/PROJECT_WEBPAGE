// updatePublicationPayment.js

import { Request, Response } from "express";
import Publicacion from "../models/publications.models";
import { io } from "..";

export const updatePublicationPayment = async (req: Request, res: Response) => {
  try {
    console.log("📩 Datos recibidos en el backend:", req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "No se han recibido datos" });
    }

    const { id } = req.params; // Obtener el ID de los parámetros de la ruta
    console.log("ID de la publicación:", id);

    const publication = await Publicacion.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    console.log("Publicación actualizada:", publication);

    if (!publication) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    // Emitir el evento de actualización de la publicación al frontend
    io.on("connection", (socket) => {
      // listener personal events fron client
      socket.on("requestDataPayPublication", () => {
        const data = { ...req.body, id };
        socket.emit("dataPayPublication", data);
      });
      console.log(
        "📩 Datos recibidos en el backend y enviados al frontend:",
        req.body,
        "ID de la publicación:",
        id
      );
    });

    // Procesar los datos de req.body
    return res.status(200).json({ message: "Datos recibidos correctamente" });
  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res
      .status(500)
      .json({ message: "Error al procesar el pago de la publicación" });
  }
};
