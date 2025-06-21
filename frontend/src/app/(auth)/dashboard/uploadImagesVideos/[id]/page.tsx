"use client";

import React, { useEffect, useState } from "react";
import HandleFileChangeEditPhotosUpload from "@/components/UploadImagesVideosEdit";
import { Button } from "@/components/ui/button";
import { useMediaCounts } from "@/hooks/useFetchMediaCounts";
import VideoUploadComponentEdit from "@/components/UploadVideosEdit";

import { useParams, useRouter } from "next/navigation";
import DuplicateFilesPopup from "@/components/ShowImageVideoCreatePub";

// SPINNER
const SimpleSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-xl text-gray-700">Subiendo la información</p>
  </div>
);

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

const UploadImagesVideos = () => {
  const [formData, setFormData] = useState<FormData>({
    userId: "",
    id: "",
    images: [],
    videos: [],
  });
  const [isLoading, setIsLoading] = useState(false); // Estado para la carga
  const router = useRouter();
  const { id } = useParams();

  console.log("ID de la publicación:", id);

  const [duplicateFiles, setDuplicateFiles] = useState<
    { filename: string; filePath: string }[]
  >([]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // <--- Iniciar carga
    console.log("primer CONSOLE.LOG DE HANDLESUBMIT", formData);

    try {
      const formDataToSend = new FormData();

      // Crear un único FormData para todos los archivos
      const combinedFormData = new FormData();

      // Subir imágenes

      combinedFormData.append("type", "image"); // Indicar que es una imagen

      if (Array.isArray(formData.images)) {
        formData.images.forEach((image) => {
          if (image !== null) {
            combinedFormData.append("files", image);
            combinedFormData.append("type", "image"); // Indicar que es una imagen
          }
        });
      }

      // agregar el id de la publicación
      if (!id) {
        throw new Error("El ID de la publicación no está definido.");
      }
      combinedFormData.append("id", id.toString()); // Asegurarse de que id no sea undefined

      combinedFormData.append("userId", formData.userId);

      // Subir videos (si hay)
      if (formData.videos && formData.videos.length > 0) {
        if (Array.isArray(formData.videos)) {
          formData.videos.forEach((video) => {
            combinedFormData.append("files", video);
            combinedFormData.append("type", "video"); // Indicar que es un video
          });
        }
      }
      console.log("combinedFormData:", combinedFormData);
      console.log("formData.userId:", formData.userId);
      const ResponseImageVideo = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/publicacionesImageUpdate/upload/${formData.userId}`,
        {
          method: "POST",
          body: combinedFormData,
        }
      );

      // Manejar la respuesta del backend
      const imageData = await ResponseImageVideo.json();
      console.log(
        "Respuesta del backend y se incluye globalDuplicates :",
        imageData
      );

      if (!ResponseImageVideo.ok) {
        console.log(
          "Ejecutando setDuplicateFiles con:",
          imageData.duplicateFiles
        );
        // Si hay archivos duplicados del mismo usuario, mostrar un mensaje al usuario
        if (imageData.duplicateFiles && imageData.duplicateFiles.length > 0) {
          console.log("Nuevos duplicados recibidos:", imageData.duplicateFiles);
          setDuplicateFiles([]); // Limpiar el estado
          setDuplicateFiles([...imageData.duplicateFiles]);
        } else if (
          imageData.globalDuplicates &&
          imageData.globalDuplicates.length > 0
        ) {
          console.log(
            "Nuevos duplicados recibidos de otros usuarios:",
            imageData.globalDuplicates
          );
          setDuplicateFiles([]); // Limpiar el estado
          setDuplicateFiles([...imageData.globalDuplicates]);
        }
        return; // Detener el proceso si hay duplicados
      }

      // Verificar que imageData.uploadedFiles exista y tenga datos
      if (!imageData.uploadedFiles || !Array.isArray(imageData.uploadedFiles)) {
        throw new Error("No se recibieron archivos subidos desde el backend.");
      }

      // Si no hay duplicados, continuar con el proceso
      // Separar las URLs de imágenes y videos
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];

      imageData.uploadedFiles.forEach((file: { url: string; type: string }) => {
        if (file.type === "image") {
          imageUrls.push(file.url);
        } else if (file.type === "video") {
          videoUrls.push(file.url);
        }
      });

      // Agregar campos básicos
      Object.entries(formData).forEach(([key, value]) => {
        if (
          key !== "images" &&
          key !== "videos" &&
          key !== "fotoPrincipal" &&
          value != null
        ) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Agregar las URLs de imágenes y videos al FormData
      formDataToSend.append("imageUrls", JSON.stringify(imageUrls));

      formDataToSend.append("videoUrls", JSON.stringify(videoUrls));
      console.log("formDataToSend:", formDataToSend);

      //enviar las imagenes al sessionStorage

      const dataToStorage = {
        userId: formData.userId,
        images: imageUrls,
        videos: videoUrls,
      };

      localStorage.setItem("dataToStorage", JSON.stringify(dataToStorage));
      console.log(
        "Imágenes guardadas en localStorage:",
        JSON.parse(localStorage.getItem("dataToStorage") || "[]")
      );

      router.push(`/dashboard/validate/${formData.userId}/${id}`);
    } catch (error) {
      console.error("Error al crear la publicación:", error);
      alert("Error al crear la publicación. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false); // <--- Finalizar carga
    }
  };

  return (
    <>
      {/*COMPONENTE QUE RENDERIZA LOS DUPLICADOS*/}
      <div>
        {duplicateFiles && duplicateFiles.length > 0 && (
          <DuplicateFilesPopup
            onClose={() => setDuplicateFiles([])}
            duplicateFiles={duplicateFiles}
          />
        )}
      </div>

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
                <Button
                  type="submit"
                  className="min-w-[20rem] text-lg"
                  disabled={
                    isLoading ||
                    !formData.userId ||
                    (!formData.images.length && !formData.videos.length)
                  } // Deshabilitar si está cargando, no hay userId o no hay archivos
                >
                  {isLoading ? (
                    <>
                      <SimpleSpinner />
                      Actualizando la Publicidad
                    </>
                  ) : (
                    "Enviar y seguir con la validación"
                  )}
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
