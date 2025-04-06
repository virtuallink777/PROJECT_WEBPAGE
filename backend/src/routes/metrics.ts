import { Router, Request, Response } from "express";
import postMetrics from "../models/postMetrics";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { postId, eventType } = req.body; // ⚠️ Debe ser "postId" en lugar de "_id"

    console.log("📌 Datos recibidos en API (POST):", req.body);
    console.log("✅ postId a guardar:", postId);
    console.log("✅ eventType a incrementar:", eventType);

    if (!postId || !eventType) {
      return res
        .status(400)
        .json({ error: "Faltan datos: postId y eventType requeridos" });
    }

    console.log("🔍 postId recibido en API (POST):", postId);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Se asegura de que la fecha esté en 00:00:00

    const validEventTypes = [
      "clicks",
      "click",
      "whatsappClicks",
      "whatsappClick",
      "liveChatClicks",
      "liveChatClick",
    ];

    if (!validEventTypes.includes(eventType)) {
      return res
        .status(400)
        .json({ error: `eventType '${eventType}' no es válido` });
    }

    console.log("📌 eventType recibido:", eventType);
    console.log("📌 eventType válido:", validEventTypes.includes(eventType));

    // Mapea el eventType recibido a los campos correctos de la base de datos
    let fieldToIncrement;
    if (eventType === "click") {
      fieldToIncrement = "clicks";
    } else if (eventType === "whatsappClick") {
      fieldToIncrement = "whatsappClicks";
    } else if (eventType === "liveChatClick") {
      fieldToIncrement = "liveChatClicks";
    } else {
      fieldToIncrement = eventType; // mantiene el original para otros casos
    }

    // Primero verifica si el documento existe
    const existingDoc = await postMetrics.findOne({
      postId: String(postId),
      date: today,
    });

    let updatedMetric;

    if (existingDoc) {
      // Si el documento existe, solo incrementa el campo
      updatedMetric = await postMetrics.findOneAndUpdate(
        { postId: String(postId), date: today },
        { $inc: { [fieldToIncrement]: 1 } },
        { new: true }
      );
    } else {
      // Si el documento no existe, créalo con los valores iniciales
      updatedMetric = await postMetrics.create({
        postId: String(postId),
        date: today,
        clicks: fieldToIncrement === "clicks" ? 1 : 0,
        whatsappClicks: fieldToIncrement === "whatsappClicks" ? 1 : 0,
        liveChatClicks: fieldToIncrement === "liveChatClicks" ? 1 : 0,
      });
    }

    console.log(
      "✅ Documento actualizado:",
      JSON.stringify(updatedMetric, null, 2)
    );

    // Usar await y una variable temporal para el segundo console.log
    const verificationDoc = await postMetrics.findOne({
      postId: String(postId),
      date: today,
    });
    console.log("✅ Verificación:", JSON.stringify(verificationDoc, null, 2));

    console.log("🚀 Intentando incrementar:", eventType);
    console.log("📌 Tipo de eventType:", typeof eventType);

    return res.status(200).json({ message: "Métrica actualizada" });
  } catch (error) {
    console.error("Error actualizando métricas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/:postId", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    if (!postId) {
      return res.status(400).json({ error: "Faltan datos: postId requerido" });
    }

    console.log(
      `🛠 [BACKEND] GET /api/metrics/${postId} - ${new Date().toISOString()}`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Se asegura de que la fecha esté en 00:00:00

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo es el primer día de la semana
    startOfWeek.setHours(0, 0, 0, 0); // Se asegura de que la fecha esté en 00:00:00

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // metrica diaria
    const dailyMetrics = await postMetrics.findOne({ postId, date: today });

    // 📆 MÉTRICA SEMANAL
    const weeklyMetrics = await postMetrics.aggregate([
      {
        $match: {
          postId,
          date: { $gte: startOfWeek, $lte: today },
        },
      },
      {
        $group: {
          _id: null,
          clicks: { $sum: "$clicks" },
          whatsappClicks: { $sum: "$whatsappClicks" },
          liveChatClicks: { $sum: "$liveChatClicks" },
        },
      },
    ]);

    // 📆 MÉTRICA MENSUAL
    const monthlyMetrics = await postMetrics.aggregate([
      {
        $match: {
          postId,
          date: { $gte: startOfMonth, $lte: today },
        },
      },
      {
        $group: {
          _id: null,
          clicks: { $sum: "$clicks" },
          whatsappClicks: { $sum: "$whatsappClicks" },
          liveChatClicks: { $sum: "$liveChatClicks" },
        },
      },
    ]);

    // 📆 MÉTRICA ANUAL
    const yearlyMetrics = await postMetrics.aggregate([
      {
        $match: {
          postId,
          date: { $gte: startOfYear, $lte: today },
        },
      },
      {
        $group: {
          _id: null,
          clicks: { $sum: "$clicks" },
          whatsappClicks: { $sum: "$whatsappClicks" },
          liveChatClicks: { $sum: "$liveChatClicks" },
        },
      },
    ]);

    res.status(200).json({
      daily: dailyMetrics || {
        clicks: 0,
        whatsappClicks: 0,
        liveChatClicks: 0,
      },
      weekly: weeklyMetrics[0] || {
        clicks: 0,
        whatsappClicks: 0,
        liveChatClicks: 0,
      },
      monthly: monthlyMetrics[0] || {
        clicks: 0,
        whatsappClicks: 0,
        liveChatClicks: 0,
      },
      yearly: yearlyMetrics[0] || {
        clicks: 0,
        whatsappClicks: 0,
        liveChatClicks: 0,
      },
    });
  } catch (error) {
    console.error("Error obteniendo métricas:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
