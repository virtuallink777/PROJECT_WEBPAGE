// src/app/(auth)/dashboard/pruebas/page.tsx
"use client";
import { useEffect, useState } from "react";
import GoogleMapView from "@/components/GoogleMapView";

interface Publication {
  Pais: string;
  ciudad: string;
  direccion?: string;
  mostrarEnMaps?: boolean;
}

const PruebasPage = () => {
  const [publication, setPublication] = useState<Publication>({
    Pais: "Colombia",
    ciudad: "Bogotá",
    direccion: "Carrera 72A No. 9-22",
    mostrarEnMaps: true,
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl mb-4">Prueba de Google Maps</h1>

      {/* Para pruebas, mostramos la dirección */}
      <div className="mb-4">
        <p>País: {publication.Pais}</p>
        <p>Ciudad: {publication.ciudad}</p>
        <p>Dirección: {publication.direccion}</p>
        <p>Mostrar en Maps: {publication.mostrarEnMaps ? "Sí" : "No"}</p>
      </div>

      {/* Componente del mapa */}
      <GoogleMapView
        pais={publication.Pais}
        ciudad={publication.ciudad}
        direccion={publication.direccion || ""}
        isVisible={!!publication.mostrarEnMaps}
      />
    </div>
  );
};

export default PruebasPage;
