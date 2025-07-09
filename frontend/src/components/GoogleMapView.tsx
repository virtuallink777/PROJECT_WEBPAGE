// components/GoogleMapView.tsx

"use client";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useState, useCallback, useEffect } from "react";

interface GoogleMapViewProps {
  pais: string;
  ciudad: string;
  direccion: string;
  isVisible: boolean;
}

const GoogleMapView = ({
  pais,
  ciudad,
  direccion,
  isVisible,
}: GoogleMapViewProps) => {
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const containerStyle = {
    width: "60%",
    height: "400px",
    margin: "0 auto",
  };

  const defaultCenter = {
    lat: 0,
    lng: 0,
  };

  const getCoordinates = useCallback(async () => {
    // Movemos la función aquí dentro
    const fullAddress = `${direccion}, ${ciudad}, ${pais}`;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        setCoordinates(data.results[0].geometry.location);
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }
  }, [pais, ciudad, direccion]); // Ahora las dependencias están correctas

  // Llamamos a getCoordinates cuando cambian las props
  useEffect(() => {
    if (isVisible && direccion) {
      getCoordinates();
    }
  }, [isVisible, direccion, getCoordinates]);

  // Solo mostramos el mapa si isVisible es true y tenemos una dirección
  if (!isVisible || !direccion) return null;

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={coordinates || defaultCenter}
        zoom={15}
      >
        {coordinates && <Marker position={coordinates} />}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapView;
