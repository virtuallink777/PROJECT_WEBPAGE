import express, { Request, Response } from "express";
import Publicacion from "../models/publications.models"; // Asegúrate que este modelo incluye originalFilename

const publicationsRouter = express.Router();

// Crear una nueva publicación
publicationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Datos recibidos en el backend /publications:", req.body); // Log para ver todo lo que llega

    // Extraer los datos del cuerpo de la solicitud
    // Ahora esperamos imagesData y videosData en lugar de imageUrls, etc.
    const {
      email,
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
      imagesData, // <--- NUEVO: Esperamos este campo
      videosData, // <--- NUEVO: Esperamos este campo
    } = req.body;

    // --- Parsear los datos de imágenes y videos ---
    let parsedImagesData: any[] = []; // Define el tipo según la estructura que envías desde el frontend
    if (imagesData && typeof imagesData === "string") {
      try {
        parsedImagesData = JSON.parse(imagesData);
        console.log("Datos de imágenes parseados:", parsedImagesData);
      } catch (e) {
        console.error("Error al parsear imagesData:", e);
        return res
          .status(400)
          .json({ error: "Formato de imagesData inválido." });
      }
    } else if (Array.isArray(imagesData)) {
      // Si por alguna razón ya viene como array (menos común con FormData)
      parsedImagesData = imagesData;
    }

    let parsedVideosData: any[] = []; // Define el tipo
    if (videosData && typeof videosData === "string") {
      try {
        parsedVideosData = JSON.parse(videosData);
        console.log("Datos de videos parseados:", parsedVideosData);
      } catch (e) {
        console.error("Error al parsear videosData:", e);
        return res
          .status(400)
          .json({ error: "Formato de videosData inválido." });
      }
    } else if (Array.isArray(videosData)) {
      parsedVideosData = videosData;
    }

    // --- Procesar y mapear los datos para el modelo Publicacion ---
    const images = parsedImagesData.map((imgData: any) => ({
      // Usa el tipo ImageObjectForBackend si lo tienes aquí
      url: imgData.url,
      isPrincipal: imgData.isPrincipal, // Ya debería ser un booleano desde el frontend
      filename: imgData.filename, // El filename generado por Cloudinary (ej: randomid.png)
      originalFilename: imgData.originalFilename, // El nombre original del archivo
      // cloudinaryPublicId: imgData.cloudinaryPublicId // Opcional: si quieres guardar el public_id completo también
    }));

    const videos = parsedVideosData.map((vidData: any) => ({
      // Usa el tipo VideoObjectForBackend
      url: vidData.url,
      filename: vidData.filename,
      originalFilename: vidData.originalFilename,
      // cloudinaryPublicId: vidData.cloudinaryPublicId
    }));

    // Crear la nueva instancia de Publicacion
    const nuevaPublicacion = new Publicacion({
      email,
      userId,
      esMayorDeEdad: esMayorDeEdad === "true", // Asegurar que los booleanos se manejen correctamente si vienen como string
      nombre,
      edad,
      telefono,
      Categorias,
      Pais,
      Departamento,
      ciudad,
      Localidad,
      direccion,
      mostrarEnMaps: mostrarEnMaps === "true", // Asegurar que los booleanos se manejen correctamente
      titulo,
      descripcion,
      adicionales,
      images, // El array de objetos de imagen procesados
      videos, // El array de objetos de video procesados
    });

    console.log(
      "Objeto nuevaPublicacion listo para guardar:",
      JSON.stringify(nuevaPublicacion, null, 2)
    );

    const result = await nuevaPublicacion.save();

    res.status(201).json({
      message: "Publicación creada exitosamente",
      publicacion: result, // 'result' ahora debería contener 'originalFilename' en images/videos
    });
  } catch (error) {
    console.error("Error al crear la publicación:", error);
    // Verifica si el error es de validación de Mongoose (por ejemplo, si falta originalFilename y es requerido)
    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({
        error: "Error de validación al crear la publicación",
        details: (error as any).errors,
      });
    }
    res.status(500).json({ error: "Error al crear la publicación" });
  }
});

export default publicationsRouter;
