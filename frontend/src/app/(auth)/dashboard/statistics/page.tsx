"use client";

import PostMetrics from "@/components/PostId";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

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
      } catch (error) {
        console.error("Error al cargar publicaciones:", error);
        // Verificamos si el error es un error de Axios
        if (axios.isAxiosError(error)) {
          // Si es un error de Axios, ahora podemos acceder a 'response' de forma segura
          if (error.response?.status === 401) {
            console.log("Error 401 detectado, redirigiendo a sign-in...");
            router.push("/sign-in");
          } else {
            // Opcional: Manejar otros errores de Axios (ej. 404, 500)
            console.error(
              `Error de Axios no manejado: ${error.response?.status}`,
              error.message
            );
          }
        } else {
          // Si no es un error de Axios, es otro tipo de error (ej. de red, o de JS)
          // No intentamos redirigir, solo lo registramos para no crear bucles inesperados.
          console.error("Error no-Axios al cargar publicaciones:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 👈 Ahora solo se ejecuta al montar el componente

  console.log("Publicaciones:", publications);

  return (
    <div className="flex flex-col gap-4 w-full h-full items-center justify-center mt-4">
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
                    ? `${pub.images[0].url}`
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
