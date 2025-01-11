"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

type Publication = {
  _id: string;
  nombre: string;
  edad: number;
  titulo: string;
  telefono: string;
  createdAt: Date;
  images: {
    url: string;
  }[];
};

// Función para obtener el ID del cliente
async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    return data.userId;
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

const ViewPublications = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const userId = await obtenerIdCliente();
        if (!userId) {
          throw new Error("No se pudo obtener el ID del usuario");
        }

        const response = await api.get(`/api/publicationsThumbnails/${userId}`);
        setPublications(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error al cargar publicaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Cargando...
      </div>
    );
  }

  const baseURL = "http://localhost:4004";

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Mis Publicaciones</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publications.map((pub) => (
          <Card
            key={pub._id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Image
              src={`${baseURL}${pub.images[0]?.url}` || "/default-image.png"}
              width={300}
              height={300}
              alt="ppalImages"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="font-semibold text-lg mb-2">{pub.nombre}</h2>
              <p className="text-gray-600">Edad: {pub.edad}</p>
              <p className="text-gray-700 mt-2 line-clamp-2">{pub.titulo}</p>
              <p className="text-gray-700 mt-2 line-clamp-2">
                Telefono: {pub.telefono}
              </p>
              <p className="text-gray-700 mt-2 line-clamp-2">
                Fecha de creación: {""}
                {new Date(pub.createdAt).toLocaleDateString("es-ES")}
              </p>
              <p className="text-gray-700 mt-2 line-clamp-2 text-center">
                {/* Enlace de editar */}
                <Link href={`/dashboard/editPublication/${pub._id}`} passHref>
                  <span className="text-blue-500 cursor-pointer hover:underline">
                    Editar
                  </span>
                </Link>
              </p>
              <p className="text-gray-700 mt-2 line-clamp-2">
                Estado:{" "}
                <span className="text-blue-500 cursor-pointer hover:underline">
                  Pendiente de activación
                </span>
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ViewPublications;
