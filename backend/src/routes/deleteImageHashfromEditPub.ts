import { Request, Response } from "express";
import { UserHash } from "../models/hashImagesVideos";

export const deleteImageHash = async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ message: "Falta el nombre del archivo" });
    }

    // Buscar y eliminar el hash asociado a la imagen

    const result = await UserHash.updateOne(
      { "imageHashes.fileName": filename },
      { $pull: { imageHashes: { fileName: filename } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "HASH no encontrada" });
    }

    res.status(200).json({ message: "HASH eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar el hash:", error);
    res.status(500).json({ message: "Error al eliminar el hash" });
  }
};
