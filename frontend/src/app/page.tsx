"use client";

import { useEffect, useState } from "react";
import MaxWidthWrapper from "../components/MaxWidthWrapper";
import PublicationCard from "@/components/PublicationCard";
import { useFilterStore } from "../lib/storeZsutandCities"; // Importamos Zustand

interface Publication {
  _id: string;
  nombre: string;
  categorias: string;
  pais: string;
  departamento: string;
  ciudad: string;
  localidad: string;
  direccion: string;
  mostrarEnMaps: boolean;
  edad: number;
  telefono: string;
  titulo: string;
  descripcion: string;
  adicionales: string;
  status: boolean;
  images: {
    url: string;
    isPrincipal: boolean;
    filename: string;
    _id: string;
  }[];
  videos: {
    url: string;
  }[];
}

export default function Home() {
  const [topPublications, setTopPublications] = useState<Publication[]>([]);
  const [nonTopPublications, setNonTopPublications] = useState<Publication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { selections } = useFilterStore(); // Estado global de filtros

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        // Obtener las publicaciones TOP filtradas
        const topRes = await fetch(
          "http://localhost:4004/api/publicationsTOP",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(selections),
          }
        );
        const topData = await topRes.json();
        setTopPublications(topData);

        // Obtener las publicaciones sin TOP filtradas
        const nonTopRes = await fetch(
          "http://localhost:4004/api/publicationsNOTOP",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(selections),
          }
        );
        const nonTopData = await nonTopRes.json();
        setNonTopPublications(nonTopData);
      } catch (error) {
        console.error("Error al obtener las publicaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublications();
  }, [selections]);

  console.log("publicaciones TOP:", topPublications);
  console.log("publicaciones sin TOP:", nonTopPublications);

  return (
    <MaxWidthWrapper>
      <div className="py-20 mx-auto text-center flex flex-col items-center w-full">
        <h1 className="text-4xl font-bold tracking-tight">
          Bienvenidos a la Pagina de Inicio
        </h1>

        {/* Publicaciones TOP */}
        <div className="mt-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Publicaciones TOP</h2>
          <div className="grid grid-cols-4 gap-4">
            {topPublications.length > 0 &&
              topPublications.map((pub) => (
                <PublicationCard key={pub._id} publication={pub} />
              ))}
          </div>
        </div>

        {/* Publicaciones no TOP */}
        <div className="mt-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Otras Publicaciones</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {nonTopPublications.length > 0 &&
              nonTopPublications.map((pub) => (
                <PublicationCard key={pub._id} publication={pub} />
              ))}
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
