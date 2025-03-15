"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Phone, Video } from "lucide-react";
import { useParams } from "next/navigation";

import Image from "next/image";

interface ImageItem {
  url: string;
  isPrincipal: boolean;
  filename: string;
  _id: string;
}

interface IPublication {
  nombre: string;
  edad: number;
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
  images: ImageItem[];
  videos: string[];
}

const PublicacionDetalle = () => {
  const [publicacion, setPublicacion] = useState<IPublication>();

  // obtenemos el id de la publicacion de los parametros

  const publicationId = useParams().id;

  console.log("publicationId", publicationId);

  const fetchPublicacion = async () => {
    try {
      const response = await fetch(
        `http://localhost:4004/api/editPublications/${publicationId}`
      );
      if (!response.ok) {
        throw new Error("No se pudo obtener la publicación");
      }

      const data = await response.json();
      setPublicacion(data);
      console.log("publicacion", publicacion);
    } catch (error) {
      console.error("Error al obtener la publicación:", error);
    }
  };

  useEffect(() => {
    fetchPublicacion();
  }, [publicationId]);

  console.log("publicacion en render:", publicacion); // Este log mostrará el valor actualizado en cada renderizado

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Encabezado de la publicación */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-400 p-6 text-white">
        <h1 className="text-2xl font-bold">{publicacion?.titulo}</h1>
        <div className="flex items-center mt-2 text-sm opacity-90">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{`${publicacion?.Localidad}, ${publicacion?.ciudad}, ${publicacion?.Departamento}, ${publicacion?.Pais}`}</span>
        </div>
      </div>

      {/* Cuerpo principal */}
      <div className="p-6">
        {/* Sección de información personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Información Personal
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre:</span>
                <span className="font-medium">{publicacion?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Edad:</span>
                <span className="font-medium">{publicacion?.edad} años</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Categoría:</span>
                <span className="font-medium">{publicacion?.Categorias}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Teléfono:</span>
                <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                  <Phone className="w-4 h-4 mr-1 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {publicacion?.telefono}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Ubicación
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Dirección:</span>
                <span className="font-medium text-right">
                  {publicacion?.direccion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ciudad:</span>
                <span className="font-medium">{publicacion?.ciudad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Departamento:</span>
                <span className="font-medium">{publicacion?.Departamento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">País:</span>
                <span className="font-medium">{publicacion?.Pais}</span>
              </div>
              {publicacion?.Localidad && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Localidad:</span>
                  <span className="font-medium">{publicacion?.Localidad}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Descripción
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg w-full break-words whitespace-normal">
            <p className="text-gray-700">{publicacion?.descripcion}</p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Información Adicional
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg w-full break-words whitespace-normal">
            <p className="text-gray-700">{publicacion?.adicionales}</p>
          </div>
        </div>

        {/* Tabs para imágenes y videos */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {publicacion?.images?.map((image, index) => (
              <div
                key={index}
                className="relative w-full max-w-[500px] aspect-video border rounded-lg overflow-hidden bg-gray-200 shadow-sm"
              >
                <Image
                  src={`http://localhost:4004${image.url}`}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={500}
                  height={500}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicacionDetalle;
