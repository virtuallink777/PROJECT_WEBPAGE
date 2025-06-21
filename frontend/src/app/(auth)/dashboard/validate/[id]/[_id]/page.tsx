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

  interface DataItems {
    userId: string;
    email: string;
    id: string;
    images: { url: string }[];
    shippingDateValidate: string;
  }

  const handleUploadCartel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFotoConCartel(file);
  };

  const handleUploadRostro = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFotoRostro(file);
  };

  const handleRostroSelection = (respuesta: string) => {
    if (!fotoConCartel) {
      alert("Debes subir la foto con cartel primero.");
      return;
    }

    setMuestraRostro(respuesta);

    if (respuesta === "Sí") {
      alert("Por favor dar click en  Enviar para validar la publicidad.");
      setMostrarAdvertencia(false);
    } else {
      alert(
        "Por favor sube una foto de las que subiste en tu publicidad mostrando el rostro. Esta foto NO SE VA A PUBLICAR, solo es para validación."
      );
      setMostrarAdvertencia(true);
    }
  };

  const storedData = JSON.parse(
    sessionStorage.getItem("dataToStorage") || "{}"
  );

  const userId = storedData.userId;
  const email = storedData.email;
  const _id = storedData._id;
  const images: { url: string }[] = storedData.images || [];
  const shippingDateValidate = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
  });

  const dataItems: DataItems = {
    userId,
    id: _id,
    images,
    email,
    shippingDateValidate,
  };

  console.log("User ID:", userId);
  console.log("Email:", email);
  console.log("_id:", _id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fotoConCartel) {
      alert("Debes subir la foto con cartel antes de enviar.");
      return;
    }

    if (muestraRostro === null && !fotoRostro) {
      alert("Debes Seleccionar Sí o No para continuar");
      return;
    }

    if (muestraRostro === "No" && !fotoRostro) {
      alert(
        "Debes subir una foto de las que subiste en tu publicidad mostrando el rostro. Esta foto NO SE VA A PUBLICAR, solo es para validación."
      );
      return;
    }

    const formData = new FormData();

    // Agregar cada URL de imagen como un campo separado
    images.forEach((image, index: number) => {
      formData.append(`images[${index}]`, image.url);
    });

    // Verificar los datos antes de enviarlos
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    formData.append("fotoCartel", fotoConCartel);

    if (muestraRostro === "No" && fotoRostro) {
      formData.append("fotoRostro", fotoRostro);
    }

    formData.append("dataItems for sessionStorage", JSON.stringify(dataItems));
    console.log("Contenido de dataItems para validar:", dataItems);

    formData.append("muestraRostro", muestraRostro || "");

    formData.append("shippingDateValidate", shippingDateValidate);

    // Verificar qué datos se están enviando
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate/${userId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Error al subir la publicidad");
      }

      alert(
        "Publicidad en proceso de validación, en unos minutos tendrás respuesta."
      );
      router.push("/dashboard/viewPublications");
    } catch (error) {
      console.log("Error al subir la publicidad para la validacion:", error);
    }
  };

  const today = new Date().toLocaleDateString();

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form>
        <h2 className="text-lg font-semibold text-center mb-4">
          Validación de Publicidad
        </h2>

        {/* Ejemplo de silueta con cartel */}
        <div className="relative flex flex-col items-center mb-4">
          <p>
            PASO 1: Sube una imagen tuya sosteniendo un cartel con la fecha de
            hoy:
          </p>
          <Image
            src="/SilueteValidate.webp"
            alt="Ejemplo de cartel"
            width={300}
            height={400}
            className="mb-2"
          />
          <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 border rounded text-sm font-bold">
            {today}
          </div>
        </div>

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
