import express from "express";
import { updatePublicationImagesVideos } from "../controllers/updatePublicationImagesVideos";

const router = express.Router();

// Ruta para actualizar la publicación por ID
router.put("/:id", updatePublicationImagesVideos);

export default router;
