import { Router } from "express";
import axios from "axios";

const router = Router();

router.post("/create", async (req, res) => {
  const { amount, description, customer } = req.body;

  try {
    const response = await axios.post(
      `https://sandbox-api.openpay.co/v1/${process.env.OPENPAY_MERCHANT_ID}/charges`,
      {
        method: "bank_account", // PSE method
        amount,
        currency: "COP",
        description,
        customer,
        redirect_url: "http://localhost:3000/payment-success", // URL de redirección
        order_id: `order_${Date.now()}`, // 👈 Aquí generamos un order_id único
      },
      {
        auth: {
          username: process.env.OPENPAY_PRIVATE_KEY || "",
          password: "",
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error(
      "Error al crear el cargo PSE:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || "Error interno" });
  }
});

router.get("/status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(
      `https://sandbox-api.openpay.co/v1/${process.env.OPENPAY_MERCHANT_ID}/charges/${id}`,
      {
        auth: {
          username: process.env.OPENPAY_PRIVATE_KEY || "",
          password: "",
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error(
      "Error al obtener el estado del cargo:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || "Error interno" });
  }
});

export default router;
