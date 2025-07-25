"use client";

import React, { useEffect, useState } from "react";
import HandleFileChangeEditPhotosUpload from "@/components/UploadImagesVideosEdit";
import { Button } from "@/components/ui/button";
import { CountImagesVideos } from "@/components/CountImagesVideos";
import VideoUploadComponentEdit from "@/components/UploadVideosEdit";
import { useParams, useRouter } from "next/navigation";
import DuplicateFilesPopup from "@/components/ShowImageVideoCreatePub";
import { SimpleSpinner } from "@/components/Spinner";

async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    console.log("Full response data:", data);
    console.log("ID del usuario obtenido:", data.userId); // Este console.log debería aparecer en la consola
    return data; // Esto devuelve directamente el ID alfanumérico
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

interface FormData {
  userId: string;
  email?: string; // Asumiendo que el email puede ser parte del formData
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

  const { id } = useParams();
  const router = useRouter();

  console.log("ID de la publicación:", id);

  const [duplicateFiles, setDuplicateFiles] = useState<
    { filename: string; filePath: string }[]
  >([]);

  // Agrega este useEffect para llamar a obtenerIdCliente cuando el componente se monte
  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await obtenerIdCliente();
      if (userData) {
        setFormData((prev) => ({
          ...prev,
          userId: userData.userId,
          email: userData.email, // <-- Añadimos el email al estado
        }));
      }
    };
    fetchUserData();
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
    console.log("--- e.preventDefault() HA SIDO LLAMADO ---"); // <-- AÑADE ESTO
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

      // 1. Construimos un único objeto con TODOS los datos necesarios para la siguiente página.
      const dataForValidationPage = {
        userId: formData.userId,
        publicationId: Array.isArray(id) ? id[0] : id, // Nos aseguramos que 'id' sea un string
        email: formData.email, // Asumiendo que 'email' está en tu estado formData
        imageUrls: imageUrls, // El array de URLs de imágenes de Cloudinary
        videoUrls: videoUrls, // El array de URLs de videos de Cloudinary
      };

      // 2. Guardamos ESE ÚNICO objeto en sessionStorage bajo UNA SOLA clave.
      sessionStorage.setItem(
        "dataForValidationPage",
        JSON.stringify(dataForValidationPage)
      );

      console.log(
        "Datos guardados en sessionStorage para la página de validación:",
        dataForValidationPage
      );

      // 3. Redirigimos al usuario. Usamos un pequeño delay para asegurar la escritura.
      setTimeout(() => {
        router.push(
          `/dashboard/validate/${dataForValidationPage.userId}/${dataForValidationPage.publicationId}`
        );
      }, 100);
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
