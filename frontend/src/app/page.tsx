"use client";

import { useEffect, useState } from "react";
import MaxWidthWrapper from "../components/MaxWidthWrapper";
import PublicationCard from "@/components/PublicationCard";
import { useFilterStore } from "../lib/storeZsutandCities"; // Importamos Zustand
import { io } from "socket.io-client";

const socket = io("http://localhost:4004");

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

interface PublicationData {
  publication: Publication; // Aquí usas la interfaz Publication que ya tienes
  id: string;
}

export default function Home() {
  const [topPublications, setTopPublications] = useState<PublicationData[]>([]);
  const [nonTopPublications, setNonTopPublications] = useState<Publication[]>(
    []
  );
  const [publicationIds, setPublicationIds] = useState<string[]>([]);
  const [renderPublicationsIds, setRenderPublicationsIds] = useState<string[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const { selections } = useFilterStore(); // Estado global de filtros

  //  Restaurar el orden al cargar la página
  useEffect(() => {
    const savedOrder = localStorage.getItem("topPublicationsOrder");
    if (savedOrder) {
      try {
        const orderArray = JSON.parse(savedOrder);
        setRenderPublicationsIds(orderArray);
      } catch (error) {
        console.error("Error al restaurar el orden:", error);
      }
    }
  }, []);

  // 🔹 Escuchar cambios en publicaciones top
  // Escuchar cambios en publicaciones top
  useEffect(() => {
    socket.on("dataPayPublication", (data) => {
      console.log("📩 Datos recibidos en el frontend:", data);

      // Añadir timestamp pero mantener el objeto simple
      const dataWithTimestamp = {
        ...data,
        receivedAt: Date.now(),
      };

      setTopPublications((prev) => {
        // Filtrar duplicados existentes
        const filteredPublications = prev.filter((pub) => pub.id !== data.id);
        // Agregar nuevo dato al inicio
        return [dataWithTimestamp, ...filteredPublications];
      });

      // Solo actualizar publicationIds y llamar a processNewId si el ID no está
      // ya en renderPublicationsIds (evita procesamiento duplicado)
      if (!renderPublicationsIds.includes(data.id)) {
        setPublicationIds((prevIds) => {
          if (!prevIds.includes(data.id)) {
            return [data.id, ...prevIds];
          }
          return prevIds;
        });

        // Procesar el ID solo si es necesario
        processNewId(data.id);
      }
    });

    socket.emit("requestDataPayPublication");

    return () => {
      socket.off("dataPayPublication");
    };
  }, [renderPublicationsIds]); // Agregar renderPublicationsIds como dependencia

  // Función para procesar cada nuevo ID según la lógica requerida
  const processNewId = (newId: string) => {
    // Verificar si el ID ya está en renderPublicationsIds
    if (renderPublicationsIds.includes(newId)) {
      // Si está en renderPublicationsIds, eliminarlo de publicationIds
      setPublicationIds((prevIds) => prevIds.filter((id) => id !== newId));
    } else {
      // Si NO está en renderPublicationsIds:
      // 1. Pasarlo a renderPublicationsIds
      setRenderPublicationsIds((prevIds) => [newId, ...prevIds]);
      // 2. Eliminarlo de publicationIds
      setPublicationIds((prevIds) => prevIds.filter((id) => id !== newId));
    }
  };

  // 3. Persist el orden usando localStorage para mantenerlo entre recargas
  useEffect(() => {
    // Guardar el orden en localStorage cada vez que cambie
    if (renderPublicationsIds.length > 0) {
      localStorage.setItem(
        "topPublicationsOrder",
        JSON.stringify(renderPublicationsIds)
      );
    }
  }, [renderPublicationsIds]);

  console.log("🚀 publicationIds:", publicationIds);
  console.log("🚀 renderPublicationsIds:", renderPublicationsIds);

  // Obtener publicaciones completas sin duplicados
  const publicationsToRender = renderPublicationsIds
    .map((id) => topPublications.find((pub) => pub.id === id))
    .filter(Boolean) // Eliminar nulls/undefined
    .filter(
      (pub, index, self) =>
        // Eliminar duplicados basados en el ID
        index === self.findIndex((p) => p.id === pub.id)
    ) as PublicationData[];

  console.log("🚀 publicationsToRender:", publicationsToRender);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        // Obtener las publicaciones sin TOP filtradas
        const nonTopRes = await fetch(
          "http://localhost:4004/api/publicationsNOTOP",
          {
            method: "GET",
          }
        );
        console.log(nonTopRes);
        if (nonTopRes.ok) {
          const nonTopData = await nonTopRes.json();
          if (!nonTopData.error) {
            // Solo actualizamos si no hay error
            setNonTopPublications(nonTopData);
          }
        } else {
          console.error(
            "Error al obtener las publicaciones sin TOP:",
            nonTopRes.statusText
          );
        }
      } catch (error) {
        console.error("Error al cargar publicaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, [selections]);

  // 🔹 Rotar publicaciones cada 5 minutos
  // 1. Modificar la lógica de rotación para que solo use renderPublicationsIds
  useEffect(() => {
    const interval = setInterval(() => {
      setRenderPublicationsIds((prevIds) => {
        if (prevIds.length > 1) {
          // Mueve el primer ID al final para simular la rotación
          return [...prevIds.slice(1), prevIds[0]];
        }
        return prevIds;
      });
    }, 5 * 60 * 1000); // 5 minutos en milisegundos

    return () => clearInterval(interval);
  }, []); // Elimina la rotación de topPublications

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
            {publicationsToRender.length > 0 &&
              publicationsToRender.map((data) => (
                <PublicationCard key={data.id} publication={data.publication} />
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
