import { Request, Response } from "express";
import { UserHash } from "../models/hashImagesVideos"; // Asegúrate de importar el modelo correcto
import express from "express";
import mongoose from "mongoose";

const checkHashesRouter = express.Router();

// Ruta para verificar y gestionar los hashes
checkHashesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { imageHashes, videoHashes, userId } = req.body; // Recibe los hashes y el userId desde el frontend

    console.log("Datos recibidos desde el frontend:", {
      imageHashes,
      videoHashes,
      userId,
    });

    // Validar que se proporcionó un userId válido
    if (!userId) {
      return res.status(400).json({
        error: "Debe proporcionar un userId válido",
      });
    }

    // Convertir userId a ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Buscar en la base de datos si el usuario ya tiene una carpeta (UserHash)
    let userHashDoc = await UserHash.findOne({ userId: userObjectId });

    // Si no existe una carpeta para el usuario, crear una nueva
    if (!userHashDoc) {
      userHashDoc = new UserHash({
        userId: userObjectId,
        imageHashes: [], // Inicialmente no tiene hashes de imágenes
        videoHashes: [], // Inicialmente no tiene hashes de videos
      });
      await userHashDoc.save();
      console.log("Carpeta creada para el usuario:", userId);
    }

    // Extraer los hashes existentes de imágenes y videos
    const existingImageHashes = userHashDoc.imageHashes.map(
      (hashObj) => hashObj.hash
    );
    const existingVideoHashes = userHashDoc.videoHashes.map(
      (hashObj) => hashObj.hash
    );

    // ENCONTRAR DUPLICADOS
    const duplicateImageHashes = (imageHashes || []).filter((hash: string) =>
      existingImageHashes.includes(hash)
    );

    const duplicateVideoHashes = (videoHashes || []).filter((hash: string) =>
      existingVideoHashes.includes(hash)
    );

    // Si hay duplicados, retornar error sin guardar nada

    if (duplicateImageHashes.length > 0 || duplicateVideoHashes.length > 0) {
      return res.status(400).json({
        error: "Se encontraron archivos duplicados",
        duplicateImageHashes,
        duplicateVideoHashes,
      });
    }

    // Si no hay duplicados, proceder a guardar los nuevos hashes
    const nonExistingImageHashes = imageHashes || [];
    const nonExistingVideoHashes = videoHashes || [];

    // Agregar los nuevos hashes de imágenes a la carpeta del usuario
    if (nonExistingImageHashes.length > 0) {
      const newImageHashes = nonExistingImageHashes.map((hash: string) => ({
        hash,
        fileName: "", // Puedes agregar el nombre del archivo si lo tienes
        filePath: "", // Puedes agregar la ruta del archivo si la tienes
        createdAt: new Date(),
        fileType: "image",
      }));
      userHashDoc.imageHashes.push(...newImageHashes);
    }

    // Agregar los nuevos hashes de videos a la carpeta del usuario
    if (nonExistingVideoHashes.length > 0) {
      const newVideoHashes = nonExistingVideoHashes.map((hash: string) => ({
        hash,
        fileName: "", // Puedes agregar el nombre del archivo si lo tienes
        filePath: "", // Puedes agregar la ruta del archivo si la tienes
        createdAt: new Date(),
        fileType: "video",
      }));
      userHashDoc.videoHashes.push(...newVideoHashes);
    }

    // Guardar los cambios en la base de datos
    await userHashDoc.save();

    // Responder al frontend con los hashes existentes y los que no existen
    return res.status(200).json({
      message: "Hashes verificados y guardados correctamente",
      savedImageHashes: nonExistingImageHashes,
      savedVideoHashes: nonExistingVideoHashes,
    });
  } catch (error) {
    console.error("Error en /api/check-hashes:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default checkHashesRouter;
