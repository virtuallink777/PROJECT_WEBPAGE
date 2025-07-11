"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";

export default function ValidarPublicidad() {
  const [fotoConCartel, setFotoConCartel] = useState<File | null>(null);
  const [fotoRostro, setFotoRostro] = useState<File | null>(null);
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [muestraRostro, setMuestraRostro] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<DataItems | null>(null);

  const router = useRouter();
  const params = useParams();

  interface DataItems {
    userId: string;
    publicationId: string;
    email: string;
    imageUrls: { url: string }[];
    shippingDateValidate: string;
    videoUrls: string[];
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

  // Recuperar los datos del sessionStorage o si es re validacion, hacer fetch
  useEffect(() => {
    const loadValidationData = async () => {
      // --- PLAN A: Intentar con sessionStorage ---

      const storedData = sessionStorage.getItem("dataForValidationPage");
      if (storedData) {
        console.log("Datos encontrados en sessionStorage. Usándolos.");
        const parsedData = JSON.parse(storedData);
        setValidationData(parsedData);
        return; // Salimos de la función, ya tenemos los datos.
      }

      // --- PLAN B: Si no hay datos en sessionStorage, usar fetch ---
      console.log(
        "No hay datos en sessionStorage. Intentando fetch como Plan B."
      );

      // Obtenemos el ID de la publicación desde los parámetros de la URL
      const publicationId = params._id;

      if (!publicationId) {
        console.error(
          "No se encontró el ID de la publicación en los parámetros."
        );
        return;
      }

      try {
        // Llamar a la API para actualizar el estado en la base de datos
        const responseState = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/state-publication/`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ estado: "PENDIENTE", id: publicationId }),
          }
        );
        if (!responseState.ok) {
          throw new Error("Error al actualizar el estado de la publicación");
        }

        // Hacemos la petición al backend para obtener los datos de la publicación
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/publicationsByUserId/${publicationId}`
        );

        if (!response.ok) {
          throw new Error("Error al obtener los datos de la publicación.");
        }

        const publicationData = await response.json();
        console.log(
          "Datos para re-validación obtenidos del backend:",
          publicationData
        );

        // Creamos el objeto con la misma estructura que guardas en sessionStorage
        const dataFromBackend: DataItems = {
          userId: publicationData.userId,
          publicationId: publicationData._id,
          email: publicationData.email,

          // MUY IMPORTANTE: asegúrate de que tu backend devuelva estos arrays
          imageUrls: publicationData.images || [],
          videoUrls: publicationData.videos || [],

          // Este campo no lo tenemos, pero lo podemos generar
          shippingDateValidate: new Date().toISOString(),
        };

        setValidationData(dataFromBackend);
      } catch (error) {
        console.error("Fallo el Plan B (fetch):", error);
        // Manejar el error, quizás redirigiendo a otra pantalla
      }
    };

    loadValidationData();
  }, [params, router]);

  if (!validationData) {
    return <div>Cargando...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDACIONES DE FORMULARIO (Sin cambios) ---
    if (!fotoConCartel) {
      alert("Debes subir la foto con cartel antes de enviar.");
      return;
    }
    if (muestraRostro === null) {
      // Simplificado
      alert("Debes seleccionar 'Sí' o 'No' para continuar.");
      return;
    }
    if (muestraRostro === "No" && !fotoRostro) {
      alert(
        "Si tu rostro no se ve en el cartel, debes subir una foto de tu rostro."
      );
      return;
    }

    // --- GUARDIA DE SEGURIDAD PARA DATOS ---
    // Nos aseguramos de que los datos de la publicación se hayan cargado.
    // Tu `if (!validationData)` en el return ya debería prevenir esto, pero es una buena práctica.
    if (!validationData) {
      alert(
        "Error: No se han cargado los datos de la publicación. Refresca la página."
      );
      return;
    }

    // --- CONSTRUCCIÓN DEL FORMDATA (La parte corregida) ---
    const formData = new FormData();

    // 1. Añadimos los archivos de validación (los que el usuario sube en ESTA página)
    formData.append("fotoCartel", fotoConCartel);
    if (fotoRostro) {
      formData.append("fotoRostro", fotoRostro);
    }

    // 2. Añadimos el resto de la información necesaria como strings.
    //    Tomamos los datos directamente del estado 'validationData'.
    formData.append("publicationId", validationData.publicationId);
    formData.append("userId", validationData.userId);
    formData.append("email", validationData.email);

    // Convertimos los arrays de URLs a un string JSON para enviarlos
    formData.append(
      "originalImageUrls",
      JSON.stringify(validationData.imageUrls)
    );
    formData.append(
      "originalVideoUrls",
      JSON.stringify(validationData.videoUrls)
    );

    // Puedes añadir otros campos que el backend necesite
    formData.append("muestraRostro", muestraRostro);
    formData.append(
      "shippingDateValidate",
      new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })
    );

    // --- LOG DE VERIFICACIÓN (Para depurar) ---
    console.log("--- FormData que se enviará al backend ---");
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }
    console.log("-----------------------------------------");

    try {
      // 3. ENVIAMOS LA PETICIÓN AL BACKEND
      // La URL de la API ahora usa el userId del estado 'validationData'
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate/${validationData.userId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        // Manejo de errores mejorado
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al enviar la validación");
      }

      // 4. LIMPIEZA Y REDIRECCIÓN
      // Limpiamos el sessionStorage para que no quede basura
      sessionStorage.removeItem("dataForValidationPage");

      alert(
        "Tu publicación ha sido enviada a validación. Recibirás una respuesta en breve."
      );
      router.push("/dashboard/viewPublications");
    } catch (error) {
      console.error("Error al enviar la validación:", error);
      alert(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Ocurrió un error desconocido."
        }`
      );
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
