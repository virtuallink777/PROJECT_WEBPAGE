"use client";

import { useEffect, useState } from "react";
import MaxWidthWrapper from "../components/MaxWidthWrapper";
import PublicationCard, { IPublication } from "@/components/PublicationCard";
import { useFilterStore } from "../lib/storeZsutandCities"; // Importamos Zustand
import Link from "next/link";

export default function Home() {
  const [topPublications, setTopPublications] = useState<IPublication[]>([]);
  const [nonTopPublications, setNonTopPublications] = useState<IPublication[]>(
    []
  );
  const [forceUpdate, setForceUpdate] = useState(false);
  const [loading, setLoading] = useState(true);
  const { selections, searchText } = useFilterStore(); // Estado global de filtros

  // Función para filtrar publicaciones según las selecciones
  const filterPublications = (publications: IPublication[]) => {
    return publications.filter((pub) => {
      // Filtro por categoría
      if (selections.Categorias && pub.Categorias !== selections.Categorias) {
        return false;
      }
      // Filtro por país
      if (selections.Pais && pub.Pais !== selections.Pais) {
        return false;
      }
      // Filtro por departamento
      if (
        selections.Departamento &&
        pub.Departamento !== selections.Departamento
      ) {
        return false;
      }
      // Filtro por ciudad
      if (selections.ciudad && pub.ciudad !== selections.ciudad) {
        return false;
      }
      // Filtro por localidad
      if (selections.Localidad && pub.Localidad !== selections.Localidad) {
        return false;
      }

      // Filtro por texto de búsqueda (por ejemplo, número de teléfono)
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          pub.telefono?.toLowerCase().includes(searchLower) || // Buscar en teléfono
          pub.nombre?.toLowerCase().includes(searchLower) || // Buscar en nombre
          pub.descripcion?.toLowerCase().includes(searchLower) || // Buscar en descripción
          pub.direccion?.toLowerCase().includes(searchLower) || // Buscar en dirección
          pub.adicionales?.toLowerCase().includes(searchLower) // Buscar en adicionales
        );
      }

      // Si pasa todos los filtros, incluir la publicación
      return true;
    });
  };

  // OBTENER PUBLICACIONES TOP Y NOTOP
  useEffect(() => {
    const loadAllPublications = async () => {
      try {
        setLoading(true);
        console.log("Iniciando carga coordinada de publicaciones...");

        // 1. Primero cargar todas las publicaciones TOP
        const topRes = await fetch(
          "http://localhost:4004/api/publicationsTOP",
          {
            method: "GET",
          }
        );

        if (!topRes.ok) {
          console.error("Error al cargar publicaciones TOP", topRes.statusText);
          return;
        }

        const topData = await topRes.json();
        const allTopPublications = topData.error ? [] : topData;
        console.log("Publicaciones TOP cargadas:", allTopPublications.length);

        // 2. Luego cargar todas las publicaciones NOTOP

        const nonTopRes = await fetch(
          "http://localhost:4004/api/publicationsNOTOP",
          {
            method: "GET",
          }
        );

        if (!nonTopRes.ok) {
          console.error(
            "Error al obtener publicaciones NOTOP:",
            nonTopRes.statusText
          );
          return;
        }

        const nonTopData = await nonTopRes.json();
        const allNonTopPublications = nonTopData.error ? [] : nonTopData;
        console.log(
          "Publicaciones NOTOP cargadas:",
          allNonTopPublications.length
        );

        // 3. Aplicar filtro para determinar qué publicaciones TOP son válidas actualmente

        const validTopPublications =
          filterValidTopPublications(allTopPublications);
        console.log("Publicaciones TOP válidas:", validTopPublications.length);

        // 4. Identificar publicaciones TOP que deben moverse a NOTOP

        const invalidTopPublications = allTopPublications.filter(
          (pub) => !validTopPublications.some((valid) => valid._id === pub._id)
        );
        console.log(
          "Publicaciones TOP inválidas (mover a NOTOP):",
          invalidTopPublications.length
        );

        // 5. Actualizar estado de publicaciones TOP

        setTopPublications(validTopPublications);

        // 6. Actualizar estado de publicaciones NOTOP combinando las originales + las TOP inválidas
        // Crear Map para evitar duplicados

        const nonTopMap = new Map();

        // Agregar primero las publicaciones NOTOP originales

        allNonTopPublications.forEach((pub) => nonTopMap.set(pub._id, pub));

        // Agregar las TOP inválidas (sobrescribiendo si existe duplicado)
        invalidTopPublications.forEach((pub) => nonTopMap.set(pub._id, pub));

        // Convertir el Map a Array para actualizar el estado
        const combinedNonTopPublications = Array.from(nonTopMap.values());
        setNonTopPublications(combinedNonTopPublications);

        console.log(
          "Total publicaciones NOTOP después de combinación:",
          combinedNonTopPublications.length
        );
      } catch (error) {
        console.error("Error al cargar publicaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    // Ejecutar carga inicial
    loadAllPublications();

    // Configurar intervalo para actualización periódica
    const intervalId = setInterval(() => {
      console.log("Ejecutando actualización periódica de publicaciones...");
      loadAllPublications();
    }, 60000); // Actualizar cada 60 segundos

    return () => {
      console.log("Limpiando intervalo...");
      clearInterval(intervalId);
    };
  }, []);

  // Rotación de publicaciones TOP cada 3 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setTopPublications((prevIds) => {
        if (prevIds.length > 1) {
          setForceUpdate((prev) => !prev); // Forzar re-render
          return [...prevIds.slice(1), prevIds[0]];
        }
        return prevIds;
      });
    }, 1 * 1000 * 60);

    return () => clearInterval(interval);
  }, []);

  console.log("Publicaciones TOP:", topPublications);

  // Función para filtrar las publicaciones TOP válidas
  const filterValidTopPublications: (
    publications: IPublication[]
  ) => IPublication[] = (publications) => {
    const now = new Date();
    console.log("🕒 Hora actual:", now.toLocaleString());

    return publications.filter((pub) => {
      if (
        !pub.transactionDate ||
        !pub.selectedTime ||
        !pub.selectedPricing?.hours ||
        !pub.selectedPricing?.days
      ) {
        console.log("⛔ Publicación con datos faltantes:", pub);
        return false;
      }

      // Convertir transactionDate a objeto Date
      const [day, month, year] = pub.transactionDate.split("/").map(Number);

      // Función para convertir formato de hora
      const startHour = (timeStr) => {
        const [hourStr, period] = timeStr.split(" ");
        const hour = parseInt(hourStr);

        if (period === "PM" && hour !== 12) return hour + 12;
        if (period === "AM" && hour === 12) return 0;

        return hour;
      };

      const startHourValue = startHour(pub.selectedTime);
      let startDate = new Date(year, month - 1, day, startHourValue, 0, 0);

      // Crear correctamente el objeto Date para la transacción
      // Asumiendo que pub.transactionTime tiene horas y minutos
      let transactionHour = 0;
      let transactionMinutes = 0;

      // Parseamos la hora de transacción (ajusta según tu formato)
      if (pub.transactionTime) {
        // Si transactionTime ya es un objeto Date
        if (pub.transactionTime instanceof Date) {
          transactionHour = pub.transactionTime.getHours();
          transactionMinutes = pub.transactionTime.getMinutes();
        }
        // Si es un string, parseamos según su formato
        else if (typeof pub.transactionTime === "string") {
          // Ajusta este parsing según el formato real de pub.transactionTime
          const timeMatch = pub.transactionTime.match(/(\d+):(\d+)/);
          if (timeMatch) {
            transactionHour = parseInt(timeMatch[1]);
            transactionMinutes = parseInt(timeMatch[2]);
          }
        }
      }

      const transactionDateTimeObj = new Date(
        year,
        month - 1,
        day,
        transactionHour,
        transactionMinutes
      );

      console.log(
        "📅 Fecha de transacción:",
        transactionDateTimeObj.toLocaleString()
      );

      // Comparar sólo si es el mismo día pero hora posterior
      const sameDay =
        transactionDateTimeObj.getDate() === startDate.getDate() &&
        transactionDateTimeObj.getMonth() === startDate.getMonth() &&
        transactionDateTimeObj.getFullYear() === startDate.getFullYear();

      if (
        sameDay &&
        (transactionDateTimeObj.getHours() > startHourValue ||
          (transactionDateTimeObj.getHours() === startHourValue &&
            transactionDateTimeObj.getMinutes() > 0))
      ) {
        // Si la transacción es el mismo día pero después de la hora de inicio,
        // mover la fecha de inicio al día siguiente
        startDate.setDate(startDate.getDate() + 1);
        console.log(
          "⚠️ Transacción después de hora de inicio - movido a mañana"
        );
      }

      console.log("📅 Fecha de inicio con hora:", startDate.toLocaleString());

      // El resto de tu código continúa igual...
      const daysDuration =
        parseInt(pub.selectedPricing.days.replace(/\D/g, ""), 10) || 0;
      const dailyHours =
        parseInt(pub.selectedPricing.hours.replace(/\D/g, ""), 10) || 0;

      // Calcular fecha de fin
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysDuration);

      // Validar si la publicación está dentro del rango de días permitidos
      const isWithinDateRange = now >= startDate && now <= endDate;

      // Validar si la hora actual está dentro del horario permitido
      const nowHour = now.getHours();
      const endHour = (startHourValue + dailyHours) % 24;

      // Verificar si las horas cruzan a otro día
      const isWithinDailyHours =
        startHourValue < endHour
          ? nowHour >= startHourValue && nowHour < endHour
          : nowHour >= startHourValue || nowHour < endHour;

      console.log(`🕒 Ahora: ${now.toLocaleString()}`);
      console.log(`📅 Publicación ID: ${pub._id}`);
      console.log(`⏳ Fecha de inicio: ${startDate.toLocaleString()}`);
      console.log(`⏳ Fecha de fin: ${endDate.toLocaleString()}`);
      console.log(`🕐 Hora inicio: ${startHourValue}, Hora fin: ${endHour}`);
      console.log(
        `💡 ¿Debe estar en TOP?`,
        isWithinDateRange && isWithinDailyHours
      );

      // La publicación solo está en TOP si cumple ambas condiciones
      if (!isWithinDateRange || !isWithinDailyHours) {
        console.log(
          `⛔ Publicación fuera de horario: ${pub._id} | Hora actual: ${nowHour} | Horario permitido: ${startHourValue} - ${endHour}`
        );
        return false;
      }

      console.log(`✅ Publicación en TOP: ${pub._id}`);
      return true;
    });
  };

  const filteredTopPublications = filterPublications(topPublications);
  const filteredNonTopPublications = filterPublications(nonTopPublications);

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
            {filteredTopPublications.length > 0 ? (
              filteredTopPublications.map((data) => (
                <Link href={`/publicationUser/${data._id}`} key={data._id}>
                  <PublicationCard
                    key={data._id}
                    publication={data}
                    isTopSection={true}
                  />
                </Link>
              ))
            ) : (
              <p className="col-span-4 text-gray-500">
                No hay publicaciones TOP en este momento
              </p>
            )}
          </div>
        </div>

        {/* Publicaciones no TOP */}
        <div className="mt-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-4">Otras Publicaciones</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredNonTopPublications.length > 0 ? (
              filteredNonTopPublications.map((pub) => (
                <Link href={`/publicationUser/${pub._id}`} key={pub._id}>
                  <PublicationCard
                    key={pub._id}
                    publication={pub}
                    isTopSection={false}
                  />
                </Link>
              ))
            ) : (
              <p className="col-span-4 text-gray-500">
                No hay publicaciones disponibles
              </p>
            )}
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
