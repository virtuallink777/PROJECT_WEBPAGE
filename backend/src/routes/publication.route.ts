import express, { Request, Response } from "express";
import Publicacion from "../models/publications.models";

const publicationsRouter = express.Router();

// Crear una nueva publicación

publicationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Datos recibidos en el backend:", req.body);
    console.log("imageUrls en backend:", req.body.imageUrls);
    console.log("isPrincipal en backend:", req.body.isPrincipal);
    console.log("videos en backend:", req.body.videoUrls);
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
      imageUrls,
      isPrincipal,
      videoUrls,
    } = req.body;

    // Parsear los datos
    const parsedImageUrls = JSON.parse(imageUrls);
    const parsedIsPrincipal = JSON.parse(isPrincipal);

    const parsedVideosUrls = JSON.parse(videoUrls);

    // Procesar las URLs de las imágenes
    const images = parsedImageUrls.map((url: string, index: number) => ({
      url: url,
      isPrincipal: parsedIsPrincipal[index] === "true", // Comprobamos si es la principal
      filename: url.split("/").pop() || "",
    }));

    // Procesar las URLs de los videos
    const videos = parsedVideosUrls.map((url: string) => ({
      url: url,
      filename: url.split("/").pop() || "",
    }));

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
      images,
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
