import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Definimos la forma de los datos que vamos a manejar con TypeScript
interface MediaCounts {
  imagesCount: number;
  videosCount: number;
}

// Custom hook para obtener los conteos de imágenes y videos
export const useMediaCounts = (): MediaCounts => {
  const [mediaCounts, setMediaCounts] = useState<MediaCounts>({
    imagesCount: 0,
    videosCount: 0,
  });

  const { id } = useParams(); // Obtenemos el ID de los parámetros de la ruta

  const fetchMediaCounts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/editPublications/${id}`);
      if (!response.ok) throw new Error("No se pudo obtener la publicación");

      const data = await response.json();

      setMediaCounts({
        imagesCount: data.images?.length || 0,
        videosCount: data.videos?.length || 0,
      });
    } catch (error) {
      console.error("Error al cargar los conteos:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchMediaCounts();
  }, [fetchMediaCounts]);

  return mediaCounts; // Devolvemos los datos al componente que use el hook
};
