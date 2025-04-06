"use client";

import PostMetrics from "@/components/PostId";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Publication = {
  _id: string;
  id: string;
  userId: string;
  nombre: string;
  titulo: string;
  images: {
    url: string;
  }[];
};

// Función para obtener el ID del cliente
async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data: { userId: string } = await response.json();
    return data.userId;
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

const PostStats = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // obtenemos las publicaciones del usuario
  // Efecto para cargar las publicaciones
  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const userId = await obtenerIdCliente();
        console.log("ID del cliente:", userId);
        if (userId === null) {
          console.log("No se pudo obtener el ID del cliente.");
          router.push("/sign-in");
          return;
        }

        const response = await api.get(`/api/publicationsThumbnails/${userId}`);
        setPublications(response.data);
      } catch (error: any) {
        console.error("Error al cargar publicaciones:", error);
        if (error.response?.status === 401) {
          router.push("/sign-in");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, []); // 👈 Ahora solo se ejecuta al montar el componente

  console.log("Publicaciones:", publications);

  const baseURL = "http://localhost:4004";

  return (
    <div className="flex flex-col gap-4 w-full h-full items-center justify-center">
      {loading ? (
        <div>Cargando publicaciones...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  ">
          {publications.map((pub) => (
            <Card
              key={pub._id}
              className="overflow-hidden hover:shadow-lg transition-shadow lg:w-[20vw] sm:w-[30vw] md:w-[20vw] h-auto"
            >
              {" "}
              {/* Ajusta el tamaño aquí */}
              <Image
                src={
                  pub.images[0]?.url
                    ? `${baseURL}${pub.images[0].url}`
                    : "/default-image.png"
                }
                width={300}
                height={300}
                alt="ppalImages"
                className="w-30 h-48 object-cover"
              />
              <PostMetrics postId={pub._id} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostStats;
