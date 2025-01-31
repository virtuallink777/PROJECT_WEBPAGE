import { Request, Response } from "express";
import { UserHash } from "../models/hashImagesVideos";
import express from "express";

const checkHashesCreatePub = express.Router();

checkHashesCreatePub.post("/", async (req: Request, res: Response) => {
  try {
    const { hashes } = req.body; // Recibe los hashes desde el frontend

    // Validar que se proporcionó un array de hashes
    if (!Array.isArray(hashes) || hashes.length === 0) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar un array de hashes" });
    }

    // Buscar en la base de datos los hashes que ya existen
    const existingPublications = await UserHash.find({
      "hashes.hash": { $in: hashes }, // Buscar todos los hashes que coincidan con los proporcionados
    });

    // Extraer los hashes que ya existen
    const existingHashes = existingPublications.flatMap((pub) =>
      pub.hashes.map((hashObj) => hashObj.hash)
    );

    // Determinar los hashes que no existen en la base de datos
    const nonExistingHashes = hashes.filter(
      (hash) => !existingHashes.includes(hash)
    );

    // Devolver los hashes que ya existen y los que no existen
    return res.status(200).json({ existingHashes, nonExistingHashes });
  } catch (error) {
    console.error("Error en /api/check-hashes:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default checkHashesCreatePub;
