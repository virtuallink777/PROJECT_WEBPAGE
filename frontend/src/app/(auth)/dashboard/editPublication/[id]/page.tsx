"use client";

import HandleFileChangeEdit from "@/components/ChargerImagenPub";
import { FirstBlockPublication } from "@/components/FirstBlockPublication";
import { SecondBlockPublication } from "@/components/SecondBlockPublication";
import { ThirdBlockPublications } from "@/components/ThirdBlockPublications";
import { Button } from "@/components/ui/button";
import ChargerVideosPubEdit from "@/components/ChargerVideosPub";
import Link from "next/link";
import api from "@/lib/api";
import { isAxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

// Define una interfaz más específica para el spinner si usas uno complejo
// o simplemente usa un div con clases de Tailwind como en el ejemplo.
const SimpleSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-xl text-gray-700">Cargando datos de la publicación...</p>
  </div>
);

interface ImageData {
  url: string;
  isPrincipal: boolean;
  filename: string;
  _id: string;
}

interface VideoData {
  url: string;
  filename: string;
  _id: string;
}

interface FormData {
  _id: string;
  userId: string;
  nombre: string;
  edad: string;
  telefono: string;
  Categorias: string;
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  direccion: string;
  mostrarEnMaps: boolean;
  titulo: string;
  descripcion: string;
  adicionales: string;
  images: ImageData[];
  fotoPrincipal: File | string | null; // Permite string para URL existente, File para nueva
  videos: VideoData[];
}

// No son necesarias como variables globales, se derivarán del estado
// let imagesCount = 0;
// let videosCount = 0;
// let _Id = "";

async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message:
          "Error en la respuesta del servidor para obtener ID de usuario",
      }));
      throw new Error(
        errorData.message || "No se pudo obtener el ID del usuario"
      );
    }
    const data = await response.json();
    return data.userId;
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    // Podrías lanzar el error para manejarlo en el componente si es crítico
    return null;
  }
}

const EditPublication: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    _id: "",
    userId: "",
    nombre: "",
    edad: "",
    telefono: "",
    Categorias: "",
    Pais: "",
    Departamento: "",
    ciudad: "",
    Localidad: "",
    direccion: "",
    mostrarEnMaps: false,
    titulo: "",
    descripcion: "",
    adicionales: "",
    images: [],
    fotoPrincipal: null,
    videos: [],
  });

  const [isLoading, setIsLoading] = useState(true); // Inicia en true para mostrar loader
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { id: publicationIdFromParams } = useParams(); // Renombrado para claridad
  const router = useRouter();

  // Obtener el ID del cliente (opcional, considerar si es necesario aquí o si userId viene con la publicación)
  useEffect(() => {
    async function fetchUserId() {
      const clienteId = await obtenerIdCliente();
      if (clienteId) {
        // Solo actualiza si formData.userId aún no ha sido establecido por fetchPublication
        // O decide cuál fuente tiene prioridad para userId.
        setFormData((prev) => ({ ...prev, userId: prev.userId || clienteId }));
        console.log("ID del usuario obtenido (si no existía ya):", clienteId);
      } else {
        // Considera cómo manejar si no se puede obtener el ID del cliente y es esencial
        console.warn("No se pudo obtener el ID del cliente.");
      }
    }
    fetchUserId();
  }, []); // Corre una vez al montar

  // Obtener los datos de la publicación
  useEffect(() => {
    const fetchPublication = async () => {
      if (!publicationIdFromParams) {
        setError("No se proporcionó un ID de publicación.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/api/editPublications/${publicationIdFromParams}`
        );

        const data = response.data;
        console.log("Datos de la publicación recibidos:", data);

        setFormData({
          _id: data._id || "",
          userId: data.userId || formData.userId, // Prioriza userId de la publicación, o el ya obtenido
          nombre: data.nombre || "",
          edad: data.edad || "",
          telefono: data.telefono || "",
          Categorias: data.Categorias || "",
          Pais: data.Pais || "",
          Departamento: data.Departamento || "",
          ciudad: data.ciudad || "",
          Localidad: data.Localidad || "",
          direccion: data.direccion || "",
          mostrarEnMaps: data.mostrarEnMaps || false,
          titulo: data.titulo || "",
          descripcion: data.descripcion || "",
          adicionales: data.adicionales || "",
          images: data.images || [],
          // Asumiendo que data.fotoPrincipal es una URL si existe, o null
          // El componente HandleFileChangeEdit debería poder manejar una URL como valor inicial
          fotoPrincipal: data.fotoPrincipal || null,
          videos: data.videos || [],
        });
      } catch (error) {
        // Este bloque 'catch' se ejecutará si:
        // 1. El interceptor de Axios manejó un 401 y RECHAZÓ la promesa.
        // 2. Hubo otro error HTTP (404 Not Found, 500 Internal Server Error, etc.).
        // 3. Hubo un error de red.

        console.error(
          "Error al obtener la publicación (después del interceptor):",
          error
        );

        // --- INICIO DE LA SOLUCIÓN ---
        if (isAxiosError(error)) {
          // DENTRO DE ESTE IF, TypeScript sabe que 'error' es un AxiosError
          // y puedes acceder a sus propiedades sin problemas.

          if (error.response?.status !== 401) {
            const errorMessage =
              error.response?.data?.message || // Mensaje específico del backend
              error.message || // Mensaje genérico del error de Axios
              "Ocurrió un error al obtener los detalles de la publicación.";
            alert(errorMessage);
          }
          // Si es un 401, no hacemos nada porque el interceptor ya se encargó.
        } else {
          // Si NO es un error de Axios, es otro tipo de error inesperado.
          // Aquí puedes manejarlo de forma genérica.
          alert("Ocurrió un error inesperado. Por favor, intente de nuevo.");
          console.error("Error no relacionado con Axios:", error);
        }
        // --- FIN DE LA SOLUCIÓN ---
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublication();
  }, [publicationIdFromParams, formData.userId]); // formData.userId aquí es para asegurar que si se obtiene después, no cause un re-fetch innecesario si no cambia.
  // Podrías quitar formData.userId si la lógica de userId es más simple.

  const handleImagesChange = (updatedImages: ImageData[]) => {
    setFormData((prev) => ({ ...prev, images: updatedImages }));
  };

  const handleVideosChange = (updatedVideos: VideoData[]) => {
    setFormData((prev) => ({ ...prev, videos: updatedVideos }));
  };

  const handleFormChange = (
    name: keyof FormData,
    value: string | boolean | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // 1. Logging para verificar si handleSubmit se llama
    console.log("FRONTEND: handleSubmit - INICIO"); // <--- AÑADIR ESTE LOG

    // Crear un FormData para enviar si tienes archivos (fotoPrincipal)
    // Si solo es JSON, JSON.stringify(formData) está bien.
    // Aquí asumiré que si fotoPrincipal es un File, se maneja en el backend para subida.
    // Si no, y fotoPrincipal es solo una URL, JSON.stringify es suficiente.

    const payload = { ...formData };
    // Si fotoPrincipal es un File, necesitarías un FormData y el backend adaptado.
    // Si fotoPrincipal es la URL y no la estás cambiando, o si la cambias por otra URL,
    // el payload actual está bien. Aquí la lógica dependerá de tu backend.

    // 2. Logging para verificar la URL y el payload
    const targetUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/updatePublications/${publicationIdFromParams}`;
    console.log("FRONTEND: handleSubmit - Intentando PUT a:", targetUrl);
    // console.log("FRONTEND: handleSubmit - Payload:", JSON.stringify(payload, null, 2)); // Puede ser muy largo, pero útil

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/updatePublications/${publicationIdFromParams}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" }, // Cambiar si envías FormData
          body: JSON.stringify(payload),
        }
      );

      // 3. Logging para ver la respuesta cruda del fetch
      console.log(
        "FRONTEND: handleSubmit - Respuesta del fetch recibida. Status:",
        response.status
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error al actualizar la publicación" }));
        throw new Error(errorData.message || "Error al subir los Datos");
      }

      // Opcional: mostrar un mensaje de éxito antes de redirigir
      // alert("Publicación actualizada con éxito!");
      router.push("/dashboard/viewPublications");
    } catch (error) {
      console.error("Error al actualizar la publicación:", error);
      // --- INICIO DE LA SOLUCIÓN ---
      if (error instanceof Error) {
        // DENTRO DE ESTE IF, TypeScript sabe que 'error' es un objeto Error
        // y podemos acceder a su propiedad .message de forma segura.
        setError(error.message);
      } else {
        // Si el error no es una instancia de Error, es algo inesperado.
        // Le pasamos un mensaje genérico a nuestro estado de error.
        setError("Ocurrió un error inesperado al guardar los cambios.");
      }
      // --- FIN DE LA SOLUCILÓN ---
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERIZADO CONDICIONAL ---
  if (isLoading) {
    return (
      <div className="container mx-auto px-8 py-8 flex justify-center items-center min-h-screen">
        <SimpleSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
          Editar Publicación
        </h1>

        {/* Mostrar errores de submit */}
        {error && formData._id && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 border border-red-300 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FirstBlockPublication
            formData={formData}
            onFormChange={handleFormChange}
          />

          <SecondBlockPublication
            formData={formData}
            onFormChange={handleFormChange} // Simplificado, asumiendo que la firma coincide
          />

          <ThirdBlockPublications
            formData={formData}
            onFormChange={handleFormChange}
          />

          {/* Componentes para subir/editar archivos */}
          <div className="pt-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">
              Imágenes
            </h2>
            <HandleFileChangeEdit
              images={formData.images}
              onImagesChange={handleImagesChange}
              // fotoPrincipal={formData.fotoPrincipal} // Pasa fotoPrincipal si el componente lo maneja
              // onFotoPrincipalChange={(file) => handleFormChange('fotoPrincipal', file)}
            />
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">Videos</h2>
            <ChargerVideosPubEdit
              videos={formData.videos}
              onVideosChange={handleVideosChange}
            />
          </div>

          <div className="border-t border-gray-300 mt-8 mb-6" />

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto text-lg px-8 py-2.5 ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white font-medium rounded-md transition-colors duration-150`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar Cambios"
              )}
            </Button>

            {formData._id && ( // Solo muestra si hay un ID de publicación cargado
              <Link
                href={`/dashboard/uploadImagesVideos/${formData._id}`}
                className="w-full sm:w-auto text-lg px-8 py-2.5 text-center text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 rounded-md font-medium transition-colors duration-150"
              >
                Añadir fotos o videos
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPublication;
