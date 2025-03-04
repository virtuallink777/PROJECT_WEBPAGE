import express from "express";
import publicationsModels from "../models/publications.models";

const router = express.Router();

// Ruta para obtener todas las publicaciones de un usuario

const getPublicationsThumbnailsByUserId = router.get(
  "/:userId",
  async (req, res) => {
    //revisar esta ruta o si es: /user/:userId

    try {
      const { userId } = req.params;

      const publications = await publicationsModels
        .find({ userId })
        .sort({ createdAt: -1 }) // Ordena las publicaciones por fecha de creación en orden descendente
        .select({
          _id: 1,
          userId: 1,
          nombre: 1,
          edad: 1,
          telefono: 1,
          titulo: 1,
          createdAt: 1,
          estado: 1,
          razon: 1,
          images: {
            $filter: {
              input: "$images",
              as: "image",
              cond: { $eq: ["$$image.isPrincipal", true] },
            },
          },
          selectedPricing: {
            hours: 1,
            days: 1,
            price: 1,
          },
          selectedTime: 1,
          transactionDate: 1,
          transactionTime: 1,
        }); // Seleccionamos solo los campos necesarios para la vista miniatura

      if (!publications) {
        return res.status(404).json({
          message: "Publicaciones no encontradas",
        });
      }

      // Añadimos la URL base para las imágenes
      const publicationsWithFullUrls = publications.map((pub) => ({
        ...pub.toObject(),
        images: pub.images.map((image) => ({
          ...image,
          url: `/uploads/${userId}/${image.filename}`,
        })),
      }));

      res.json(publicationsWithFullUrls);
    } catch (error) {
      console.error("Error al obtener las publicaciones:", error);
      res.status(500).json({ error: "Error al obtener las publicaciones" });
    }
  }
);

export default getPublicationsThumbnailsByUserId;
