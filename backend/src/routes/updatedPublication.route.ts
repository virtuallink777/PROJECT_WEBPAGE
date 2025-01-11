import express from "express";
import { updatePublicationById } from "../controllers/updatePublicationById"; // Importas la función

const router = express.Router();

// Ruta para actualizar la publicación por ID
router.put("/:id", updatePublicationById);

export default router;
