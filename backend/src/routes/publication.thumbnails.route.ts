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

      if (!publications || publications.length === 0) {
        return res.status(404).json({
          message: "Publicaciones no encontradas",
        });
      }

      // ----- CAMBIO IMPORTANTE AQUÍ -----
      // Simplemente convierte los documentos de Mongoose a objetos planos.
      // La 'url' en 'image.url' ya es la URL correcta de Cloudinary desde la base de datos.
      const publicationsToSend = publications.map((pub) => {
        const pubObject = pub.toObject();
        // Si necesitas asegurarte de que 'images' sea un array y tenga elementos
        if (pubObject.images && Array.isArray(pubObject.images)) {
          // No necesitas mapear 'images' para cambiar la URL si ya es correcta.
          // Solo nos aseguramos de que la estructura es la que el frontend espera.
          // El $filter en la consulta ya debería haberte dado solo la imagen principal.
        } else {
          // Si por alguna razón images no es un array o está vacío después del filtro,
          // podrías querer manejarlo, aunque el filtro debería asegurar que si hay una principal,
          // el array 'images' tendrá un elemento.
          pubObject.images = []; // O alguna lógica de fallback
        }
        return pubObject;
      });
      // ----- FIN DEL CAMBIO IMPORTANTE -----

      res.json(publicationsToSend);
    } catch (error) {
      console.error("Error al obtener las publicaciones:", error);
      res.status(500).json({ error: "Error al obtener las publicaciones" });
    }
  }
);

export default getPublicationsThumbnailsByUserId;
