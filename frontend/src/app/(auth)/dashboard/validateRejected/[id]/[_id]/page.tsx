"use client";

import { useParams, useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
interface DataItems {
  userId: string;
  email: string;
  id: string;
  images: { url: string }[];
  shippingDateValidate: string;
}

const ValidateRejected = () => {
  const [fotoConCartel, setFotoConCartel] = useState<File | null>(null);
  const [fotoRostro, setFotoRostro] = useState<File | null>(null);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [muestraRostro, setMuestraRostro] = useState<string | null>(null);
  const router = useRouter();
  // Estado para almacenar los datos de `result`
  const [publicacionActualizada, setPublicacionActualizada] =
    useState<DataItems | null>(null);

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

  const { _id } = useParams();
  const estado = "PENDIENTE";
  const razon = "";

  console.log("Datos recibidos en la página:", { _id, estado, razon });

  useEffect(() => {
    const updateStatePublication = async () => {
      console.log("Datos enviados al state-pub:", { estado, razon, _id });
      try {
        const response = await fetch(
          `http://localhost:4004/api/state-publication/`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: _id, estado, razon }),
          }
        );
        if (!response.ok) {
          throw new Error("Error al actualizar el estado de la publicación");
        }
        const result = await response.json();
        console.log("Estado actualizado:", result);
        // Actualiza el estado con los datos de `result`
        setPublicacionActualizada(result);
      } catch (error) {
        console.error(
          "Error al actualizar el estado de la publicación:",
          error
        );
      }
    };

    updateStatePublication();
  }, [_id]); // Solo se ejecuta cuando cambian `_id` o `estado`

  console.log("Publicación actualizada:", publicacionActualizada);

  const userId = publicacionActualizada?.userId;
  const email = publicacionActualizada?.email;
  const images: { url: string }[] = publicacionActualizada?.images || [];
  const shippingDateValidate = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
  });

  const dataItems: DataItems = {
    userId: userId || "",
    id: _id,
    images,
    email: email || "",
    shippingDateValidate,
  };

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
        `http://localhost:4004/api/validate/${userId}`,
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
};

export default ValidateRejected;
