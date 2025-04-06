"use client";

import { useEffect, useState } from "react";

const PostMetrics = ({ postId }: { postId?: string }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!postId) return; // Si postId es undefined, no hacemos la petición
    console.log("Obteniendo métricas para postId:", postId); // 👈 Agrega esto

    fetch(`http://localhost:4004/api/metrics/${postId}`) // ✅ Enviamos correctamente los datos
      .then((res) => res.json())
      .then((data) => {
        console.log("Datos recibidos:", data); // 👈 Verifica qué devuelve el backend
        setStats(data);
      })
      .catch((error) => console.error("Error fetching stats:", error));
  }, [postId]);

  if (!postId) return <p>Error: No hay postId disponible.</p>;
  if (!stats) return <p>Cargando métricas...</p>;
  const renderSection = (
    title: string,
    data: { clicks: number; whatsappClicks: number; liveChatClicks: number }
  ) => (
    <div className="mt-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mb-2 text-blue-400">
        Vistas de la publicación:{" "}
        <span className="font-semibold text-gray-700">{data.clicks}</span>
      </p>
      <p className="mb-2 text-blue-400">
        Clicks en WhatsApp:{" "}
        <span className="font-semibold text-gray-700">
          {data.whatsappClicks}
        </span>
      </p>
      <p className="mb-2 text-blue-400">
        Solicitudes de chat en vivo:{" "}
        <span className="font-semibold text-gray-700">
          {data.liveChatClicks}
        </span>
      </p>
    </div>
  );

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold">📊 Métricas de la Publicación</h2>

      {renderSection("📅 Hoy", stats.daily)}
      {renderSection("📈 Esta Semana", stats.weekly)}
      {renderSection("📅 Este Mes", stats.monthly)}
      {renderSection("📆 Este Año", stats.yearly)}
    </div>
  );
};

export default PostMetrics;
