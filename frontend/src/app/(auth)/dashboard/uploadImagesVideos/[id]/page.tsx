"use client";

import React, { useEffect, useState } from "react";
import HandleFileChangeEditPhotosUpload from "@/components/UploadImagesVideosEdit";
import { Button } from "@/components/ui/button";
import { useMediaCounts } from "@/hooks/useFetchMediaCounts";
import VideoUploadComponentEdit from "@/components/UploadVideosEdit";

import { useParams, useRouter } from "next/navigation";
import CheckDuplicateImages from "@/components/CheckDuplicateImages";

async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    console.log("Full response data:", data);
    console.log("ID del usuario obtenido:", data.userId); // Este console.log debería aparecer en la consola
    return data.userId; // Esto devuelve directamente el ID alfanumérico
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

// Componente para mostrar el conteo de imágenes y videos
export const CountImagesVideos: React.FC = () => {
  const { imagesCount, videosCount } = useMediaCounts();

  return (
    <div className="container mx-auto mt-6">
      <div className="text-center">
        <h1 className="text-2xl">
          En estos momentos tienes:
          <span className="ml-2">
            <b className="font-semibold">{imagesCount}</b> imágenes
          </span>
          <span className="ml-2">
            <b className="font-semibold"> {videosCount}</b> videos guardados
          </span>
        </h1>
        <h2 className="mt-4">
          Recuerda que puedes tener máximo 12 imágenes y 4 videos
        </h2>
      </div>
    </div>
  );
};

interface FormData {
  userId: string;
  id: string;
  images: File[];
  videos: File[];
  imageUrls?: string[];
  videoUrls?: string[];
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const UploadImagesVideos = () => {
  const [formData, setFormData] = useState<FormData>({
    userId: "",
    id: "",
    images: [],
    videos: [],
  });

  const router = useRouter();
  const { id } = useParams();

  console.log("ID de la publicación:", id);

  // Agrega este useEffect para llamar a obtenerIdCliente cuando el componente se monte
  useEffect(() => {
    const fetchUserId = async () => {
      const userId = await obtenerIdCliente();
      if (userId) {
        setFormData((prev) => ({
          ...prev,
          userId: userId,
        }));
      }
    };
    fetchUserId();
  }, []); // El array vacío significa que esto se ejecutará solo una vez al montar el componente

  const handleVideosChange = (videos: File[]) => {
    if (videos !== formData.videos) {
      setFormData((prev) => ({ ...prev, videos }));
    }
  };

  const handleImagesChange = (images: File[]) => {
    if (images !== formData.images) {
      setFormData((prev) => ({ ...prev, images }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      // Verificar imágenes repetidas antes de subirlas
      const imagesRepeated = await CheckDuplicateImages(formData.images);

      // Filtrar imágenes no repetidas
      const imagesNoRepeated = formData.images.filter(
        (_, index) => !imagesRepeated[index]
      );

      // Si todas las imágenes son repetidas, detener el flujo
      if (imagesNoRepeated.length === 0) {
        alert(
          "La imagen o las imagenes que estas seleccionando ya existen en el sistema. Por favor, selecciona otras imágenes."
        );
        return;
      }

      // Subir imágenes
      const images: string[] = [];
      if (formData.images.length > 0) {
        const imageFormData = new FormData();
        formData.images.forEach((image) => {
          imageFormData.append("files", image);
        });
        imageFormData.append("userId", formData.userId);

        const imageResponse = await fetch(
          `http://localhost:4004/api/publicacionesImage/upload/${formData.userId}`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

        if (!imageResponse.ok) {
          throw new Error("Error al subir las imágenes");
        }

        const imageData = await imageResponse.json();

        images.push(
          ...imageData.files.map((file: { url: string }) => file.url)
        );

        console.log("Imagenes con Urls:", images);
      }

      // Subir videos
      const videos: string[] = [];
      if (formData.videos.length > 0) {
        const videoFormData = new FormData();
        formData.videos.forEach((video) => {
          videoFormData.append("videos", video);
        });

        const videoResponse = await fetch(
          `http://localhost:4004/api/publicacionesVideo/upload-videos/${formData.userId}`,
          {
            method: "POST",
            body: videoFormData,
          }
        );

        if (!videoResponse.ok) {
          throw new Error("Error al subir los videos");
        }

        const videoData = await videoResponse.json();
        videos.push(
          ...videoData.files.map((file: { url: string }) => file.url)
        );
      }

      console.log("Videos con Urls:", videos);

      // Preparar datos para actualizar
      const dataToUpdate = {
        images: images.map((url) => ({
          url,
          filename: url.split("/").pop(), // Extrae el nombre del archivo
        })),
        videos: videos.map((url) => ({
          url,
          filename: url.split("/").pop(), // Extrae el nombre del archivo
        })),
      };

      console.log("Datos para actualizar:", dataToUpdate);
      console.log("Datos en JSON:", JSON.stringify(dataToUpdate));

      try {
        const dataResponse = await fetch(
          `http://localhost:4004/api/updatePublicationImagesVideos/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToUpdate),
          }
        );

        if (!dataResponse.ok) {
          throw new Error("Error al subir los Datos");
        }
      } catch (error) {
        console.error("Error al subir los archivos:", error);
      }

      // Redirigir a la ruta deseada
      router.push("/dashboard/validate");
    } catch (error) {
      console.error("Error al subir los archivos:", error);
    }
  };

  return (
    <>
      <div>
        <CountImagesVideos />
      </div>

      <div className="container mx-auto mt-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subir Fotos */}
            <HandleFileChangeEditPhotosUpload
              onImagesChange={handleImagesChange}
            />

            {/* Subir Videos */}

            <VideoUploadComponentEdit onChange={handleVideosChange} />

            <div className="mt-6 flex justify-center">
              {/* Botón de envío */}
              <div className="flex justify-center ">
                <Button type="submit" className="min-w-[20rem] text-lg">
                  Enviar y seguir con la validación
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UploadImagesVideos;
