import Publicacion from "../models/publications.models";
import { Request, Response } from "express";

const updatePublicationsEndTop = async (req: Request, res: Response) => {
  try {
    const _id = req.body;

    const publication = await Publicacion.findByIdAndUpdate(
      _id,
      {
        status: false,
        selectedPayment: "",
        selectedPricing: {
          hours: "",
          days: "",
          price: "",
        },
        selectedTime: "",
        transactionDate: "",
        transactionId: "",
        transactionTime: "",
      },

      { new: true }
    );

    if (!publication) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    return res.status(200).json(publication);
  } catch (error) {
    console.error("Error al actualizar la publicación:", error);
    return res
      .status(500)
      .json({ error: "Error al actualizar la publicación" });
  }
};

export default updatePublicationsEndTop;
