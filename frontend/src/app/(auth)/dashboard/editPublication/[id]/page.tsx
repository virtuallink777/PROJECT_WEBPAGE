"use client";

import HandleFileChangeEdit from "@/components/ChargerImagenPub";
import { FirstBlockPublication } from "@/components/FirstBlockPublication";
import { SecondBlockPublication } from "@/components/SecondBlockPublication";
import { ThirdBlockPublications } from "@/components/ThirdBlockPublications";
import { Button } from "@/components/ui/button";

import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

interface ImageData {
  url: string;
  isPrincipal: boolean;
  filename: string;
  _id: string;
}

interface FormData {
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
  images: ImageData[]; // Cambiamos de `File[]` a `ImageData[]`
  fotoPrincipal: File | null;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    return data.userId; // Esto devuelve directamente el ID alfanumérico
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

const EditPublication: React.FC = ({}) => {
  const [formData, setFormData] = useState<FormData>({
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
  });

  // Obtenemos el ID del cliente al montar el componente
  useEffect(() => {
    async function fetchUserId() {
      const id = await obtenerIdCliente();
      if (id) {
        setFormData((prev) => ({ ...prev, userId: id }));
        console.log("ID del usuario obtenido:", id); // Este console.log debería aparecer en la consola
      }
    }
    fetchUserId();
  }, []);

  // constantes de los 3 bloques
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchPublication = async () => {
      try {
        const response = await fetch(`${API_URL}/api/editPublications/${id}`);
        if (!response.ok) throw new Error("No se pudo obtener la publicación");

        const data = await response.json();
        console.log(data);

        // Guardar los datos en el estado

        setFormData({
          userId: data.userId || "",
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
          fotoPrincipal: data.fotoPrincipal || null,
        });

        const imagesData = data.images;
        console.log("imagesData:", imagesData);
      } catch (error) {
        console.error("Error al obtener la publicación:", error);
      }
    };

    fetchPublication();
  }, [id]);

  // Elimina dependencias innecesarias

  const handleFormChange = (name: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const dataResponse = await fetch(
        `${API_URL}/api/updatePublications/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!dataResponse.ok) {
        throw new Error("Error al subir los Datos");
      }
    } catch (error) {
      console.error("Error al subir las imágenes:", error);
    }

    setIsSubmitting(false);

    router.push("/dashboard/viewPublications");
  };

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="container mx-auto px-8 py-8">
          <div>
            <FirstBlockPublication
              formData={formData}
              onFormChange={handleFormChange}
            />

            {error && <div className="mt-4 text-red-600">{error}</div>}

            <SecondBlockPublication
              formData={formData} // PASA EL ESTADO DEL PADRE
              onFormChange={
                (name, value) =>
                  setFormData((prev) => ({ ...prev, [name]: value })) // Actualiza el estado del padre
              }
            />

            {error && <div className="mt-4 text-red-600">{error}</div>}

            <ThirdBlockPublications
              formData={formData}
              onFormChange={handleFormChange}
            />

            {error && <div className="mt-4 text-red-600">{error}</div>}

            {/* Subir Fotos */}
            <HandleFileChangeEdit
              images={formData.images}
              onImagesChange={handleFormChange}
            />

            <div className="mt-6 flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`"min-w-[20rem]"
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPublication;
