import express, { Request, Response } from "express";
import Publicacion from "../models/publications.models";

const publicationsRouter = express.Router();

// Crear una nueva publicación

publicationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const {
      userId,
      esMayorDeEdad,
      nombre,
      edad,
      telefono,
      Categorias,
      Pais,
      Departamento,
      ciudad,
      Localidad,
      direccion,
      mostrarEnMaps,
      titulo,
      descripcion,
      adicionales,
      imagenes,
      videos,
    } = req.body;

    const nuevaPublicacion = new Publicacion({
      userId,
      esMayorDeEdad,
      nombre,
      edad,
      telefono,
      Categorias,
      Pais,
      Departamento,
      ciudad,
      Localidad,
      direccion,
      mostrarEnMaps,
      titulo,
      descripcion,
      adicionales,
      imagenes,
      videos,
    });

    const result = await nuevaPublicacion.save();
    res.status(201).json({
      message: "Publicación creada exitosamente",
      publicacion: result,
    });
  } catch (error) {
    console.error("Error al crear la publicación:", error);
    res.status(500).json({ error: "Error al crear la publicación" });
  }
});

export default publicationsRouter;
