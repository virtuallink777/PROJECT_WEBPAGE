import { Router, Request, Response } from "express";
import postMetrics from "../models/postMetrics";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const topPosts = await postMetrics.aggregate([
      {
        $group: {
          _id: "$postId",
          totalClicks: { $sum: "$clicks" },
        },
      },
      {
        $sort: { totalClicks: -1 },
      },
      {
        $addFields: {
          postObjectId: {
            $cond: {
              if: {
                $regexMatch: { input: "$_id", regex: /^[0-9a-fA-F]{24}$/ },
              },
              then: { $toObjectId: "$_id" },
              else: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: "publicacions",
          localField: "postObjectId",
          foreignField: "_id",
          as: "postInfo",
        },
      },
      {
        $unwind: {
          path: "$postInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users", // Asegúrate que tu colección de usuarios se llama "users"
          localField: "postInfo.userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: {
          path: "$userInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        // Proyección con valores por defecto para evitar resultados nulos
        $project: {
          _id: 1,
          totalClicks: 1,
          postId: "$_id",
          postTitle: { $ifNull: ["$postInfo.titulo", "Sin título"] },
          postDescription: { $ifNull: ["$postInfo.descripcion", ""] },
          userId: { $ifNull: ["$postInfo.userId", null] },
          userEmail: { $ifNull: ["$userInfo.email", ""] },
          userName: { $ifNull: ["$userInfo.nombre", ""] },
          // Incluir también una imagen principal si existe
          postImage: {
            $ifNull: [{ $arrayElemAt: ["$postInfo.images.url", 0] }, ""],
          },
        },
      },
    ]);

    res.status(200).json(topPosts);
  } catch (error) {
    console.error("Error obteniendo ranking de clics:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
