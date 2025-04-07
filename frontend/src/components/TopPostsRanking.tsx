"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
// Quita esta importación innecesaria
// import { cp } from "fs";

// Interfaz para los datos que recibimos de la API
interface TopPost {
  _id: string;
  postId: string;
  totalClicks: number;
  postTitle: string;
  postDescription: string;
  userId: string;
  userEmail: string;
  userName: string;
  postImage: string;
}

const TopPostsRanking: React.FC = () => {
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchTopPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/metricsAdmin");

        if (isMounted) {
          setTopPosts(response.data);
          // Limita el logging para evitar actualizaciones innecesarias
          console.log("Top posts cargados:", response.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error al obtener el ranking de posts:", err);
          setError(
            "No se pudo cargar el ranking de posts. Por favor, intenta de nuevo más tarde."
          );
          setLoading(false);
        }
      }
    };

    fetchTopPosts();

    // Limpieza para evitar actualizar estado en componentes desmontados
    return () => {
      isMounted = false;
    };
  }, []); // Asegúrate de que el array de dependencias esté vacío

  if (loading) {
    return <div className="text-center my-8">Cargando ranking de posts...</div>;
  }

  if (error) {
    return <div className="text-center my-8 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Ranking de Posts Más Populares
      </h2>

      {topPosts.length === 0 ? (
        <p className="text-center text-gray-500">
          No hay datos de clicks disponibles.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topPosts.map((post, index) => (
            <div
              key={post._id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative">
                {post.postImage ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${post.postImage}`}
                    alt={post.postTitle}
                    className="w-full h-48 object-cover"
                    width={500}
                    height={500}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Sin imagen</span>
                  </div>
                )}

                {/* Badge de posición en el ranking */}
                <div className="absolute top-3 left-3 bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Badge de clicks */}
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {post.totalClicks}{" "}
                  {post.totalClicks === 1 ? "click" : "clicks"}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2">
                  {post.postTitle || "Sin título"}
                </h3>

                <div className="flex items-center text-sm text-gray-500">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{post.userEmail || "Usuario desconocido"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopPostsRanking;
