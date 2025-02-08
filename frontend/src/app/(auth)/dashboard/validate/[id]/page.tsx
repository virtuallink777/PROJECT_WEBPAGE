"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ValidarPublicidad() {
  const [fotoConCartel, setFotoConCartel] = useState<File | null>(null);
  const [fotoRostro, setFotoRostro] = useState<File | null>(null);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [muestraRostro, setMuestraRostro] = useState<string | null>(null);

  const router = useRouter();

  const handleUploadCartel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFotoConCartel(file);
  };

  const handleUploadRostro = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFotoRostro(file);
  };

  const handleRostroSelection = (respuesta: string) => {
    setMuestraRostro(respuesta);

    if (respuesta === "Sí" && fotoConCartel) {
      setMostrarAdvertencia(false);
      alert(
        "Por favor dar click en el boton de enviar para validar la publicidad"
      );
    } else {
      setMostrarAdvertencia(true);
    }
  };

  const today = new Date().toLocaleDateString();

  const handleSubmit = () => {
    alert(
      "Publicidad en proceso de validacion, en unos minutos tendras respuesta"
    );
    router.push("/dashboard/viewPublications");
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md ">
      <form>
        <h2 className="text-lg font-semibold text-center mb-4">
          Validación de Publicidad
        </h2>

        {/* Ejemplo de silueta con cartel */}
        <div className="relative flex flex-col items-center mb-4">
          <p className="">
            PASO 1: Sube una imagen tuya sosteniendo un cartel con la fecha de
            hoy, como se ve en la imagen de ejemplo:
          </p>
          <Image
            src="/SilueteValidate.webp"
            alt="Ejemplo de cartel"
            width={300}
            height={400}
            className="mb-2"
          />
          <div className="absolute top-[60%] responsive left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 mb-4 border rounded text-sm font-bold">
            {today}
          </div>
          <p className="text-sm">
            Ejemplo de cómo debe tomarse la foto con la fecha de hoy
          </p>
        </div>

        {/* Subida de imagen con cartel */}
        <label className="block text-sm font-medium text-gray-700">
          Sube tu foto con el cartel:
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleUploadCartel}
          className="mt-2 p-2 border rounded w-full"
        />

        {/* Pregunta sobre el rostro en las imágenes */}
        <div className="mt-4">
          <p>PASO 2</p>
          <p className="text-sm font-medium text-gray-700">
            ¿En las fotos subidas en la publicidad muestras el rostro?
          </p>
          <div className="flex space-x-4 mt-2">
            <button
              type="button"
              onClick={() => handleRostroSelection("Sí")}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => handleRostroSelection("No")}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              No
            </button>
          </div>
        </div>

        {/* Advertencia y subida de foto de rostro si es necesario */}
        {mostrarAdvertencia && (
          <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p>
              Por favor sube una foto de las que subiste en tu publicidad
              mostrando el rostro, esta foto NO SE VA A PUBLICAR, solo es para
              validación.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadRostro}
              className="mt-2 p-2 border rounded w-full"
            />
          </div>
        )}
        <div className="flex flex-col items-center space-y-4 mt-4">
          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full text-lg"
          >
            Enviar para validar la publicidad
          </Button>
        </div>
      </form>
    </div>
  );
}
