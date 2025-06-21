"use client";

import { useState, useEffect, FormEvent, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Tipos para los parámetros de la URL DEBEN COINCIDIR CON LOS NOMBRES DE LAS CARPETAS
interface PageParams {
  id: string; // Corresponde a la carpeta [id]
  _id: string; // Corresponde a la carpeta [_id]
}

export default function ValidateIdentityDocumentPage() {
  const params = useParams<PageParams>();
  const router = useRouter();

  // Extraer parámetros usando los nombres de las carpetas
  const userId = params?.id; // Usar params.id para el ID de usuario
  const pubId = params?._id; // Usar params._id para el ID de la publicación

  // El resto de tus estados permanecen igual
  const [frontIdImage, setFrontIdImage] = useState<File | null>(null);
  const [backIdImage, setBackIdImage] = useState<File | null>(null);
  const [previewFront, setPreviewFront] = useState<string | null>(null);
  const [previewBack, setPreviewBack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publication, setPublication] = useState<any>(null); // Cambia 'any' por el tipo adecuado si lo tienes

  useEffect(() => {
    // Puedes añadir un log para verificar los parámetros recibidos
    console.log("Parámetros recibidos en la página:", params);
    console.log(
      `Intentando validar documentos para Usuario ID: ${userId}, Publicación ID: ${pubId}`
    );

    if (!userId || !pubId) {
      // Si esto se sigue mostrando, el problema está en cómo se está llegando a esta URL
      // o si la URL en el navegador no tiene los dos segmentos después de /validateIdentityDocument/
      console.error(
        "Error crítico: userId o pubId no están definidos en los parámetros de la URL."
      );
    }
  }, [params, userId, pubId]); // Dependencias del useEffect

  // efecto para obtener la publicidad por ID

  useEffect(() => {
    const fetchPublication = async () => {
      console.log("pubId:", pubId);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/editPublications/${pubId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const publication = await response.json();
        console.log("Publicación obtenida:", publication);

        setPublication(publication);
      } catch (error) {
        console.error("Error al obtener la publicación:", error);
      }
    };

    fetchPublication();
  }, [pubId]);

  console.log("publicacion encontrada:", publication);

  useEffect(() => {
    return () => {
      if (previewFront) URL.revokeObjectURL(previewFront);
      if (previewBack) URL.revokeObjectURL(previewBack);
    };
  }, [previewFront, previewBack]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    currentPreview: string | null
  ) => {
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
    }
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    } else {
      setImage(null);
      setPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!userId) {
      // Esta validación ahora usa el userId extraído de params.id
      setError("No se pudo obtener el ID del usuario. Intenta de nuevo.");
      return;
    }
    // Si también necesitas validar pubId (extraído de params._id)
    if (!pubId) {
      setError("No se pudo obtener el ID de la publicación. Intenta de nuevo.");
      return;
    }

    if (!frontIdImage || !backIdImage) {
      setError(
        "Por favor, selecciona ambas imágenes del documento de identidad."
      );
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("documentFront", frontIdImage);
    formData.append("documentBack", backIdImage);
    formData.append("publicationId", pubId);
    // Si tu backend espera el pubId (que aquí es 'this.pubId' o params._id)
    // formData.append('publicationId', pubId);
    // Si tu backend espera el userId (que aquí es 'this.userId' o params.id)
    // formData.append('userId', userId);

    try {
      // Asegúrate que la URL de la API sea correcta.
      // El userId (que viene de params.id) se usa en la URL.

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/validate-identity/${userId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al subir los documentos.");
      }

      setSuccessMessage(
        "¡Documentos subidos exitosamente! Serás redirigido en breve."
      );
      setFrontIdImage(null);
      setBackIdImage(null);
      setPreviewFront(null);
      setPreviewBack(null);

      setTimeout(() => {
        router.push("/dashboard/viewPublications");
      }, 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ocurrió un error desconocido.";
      console.error("Error en la subida:", errorMessage, { userId, pubId });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Esta es la condición que te está dando el error.
  // Ahora debería funcionar si los parámetros vienen bien en la URL.
  if (!userId || !pubId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 text-xl font-semibold">
            Error: ID de usuario o publicación no encontrado.
          </p>
          <p className="text-gray-700 mt-2">
            Por favor, verifica la URL o vuelve a intentarlo desde el dashboard.
          </p>
          <p className="text-gray-600 text-sm mt-1">
            (Esperado:
            /dashboard/validateIdentityDocument/[ID_USUARIO]/[ID_PUBLICACION])
          </p>
          <p className="text-gray-600 text-sm mt-1">
            (Recibido Usuario ID: {String(userId)}, Publicación ID:{" "}
            {String(pubId)})
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    // ... (el resto del JSX de tu formulario es el mismo que antes, solo asegúrate de que cualquier referencia
    //      a userId o pubId en el JSX use las variables correctas que definimos arriba)
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Validar Documento de Identidad
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Usuario ID: <span className="font-medium">{userId}</span>
        </p>
        <p className="mt-1 text-center text-sm text-gray-600">
          Publicación ID: <span className="font-medium">{pubId}</span>
        </p>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sube una foto legible de ambos lados de tu documento de identidad
          original.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Campo para la cara frontal */}
            <div>
              <label
                htmlFor="frontIdImageInput"
                className="block text-sm font-medium text-gray-700"
              >
                Cara Frontal del Documento
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {previewFront ? (
                    <img
                      src={previewFront}
                      alt="Vista previa frontal"
                      className="mx-auto h-48 w-auto object-contain mb-2"
                    />
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="frontIdFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Sube un archivo</span>
                      <input
                        id="frontIdFile"
                        name="frontIdFile"
                        type="file"
                        className="sr-only"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setFrontIdImage,
                            setPreviewFront,
                            previewFront
                          )
                        }
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG hasta 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Campo para la cara trasera */}
            <div>
              <label
                htmlFor="backIdImageInput"
                className="block text-sm font-medium text-gray-700"
              >
                Cara Trasera del Documento
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {previewBack ? (
                    <img
                      src={previewBack}
                      alt="Vista previa trasera"
                      className="mx-auto h-48 w-auto object-contain mb-2"
                    />
                  ) : (
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="backIdFile"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Sube un archivo</span>
                      <input
                        id="backIdFile"
                        name="backIdFile"
                        type="file"
                        className="sr-only"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) =>
                          handleFileChange(
                            e,
                            setBackIdImage,
                            setPreviewBack,
                            previewBack
                          )
                        }
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG hasta 10MB
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            {successMessage && (
              <p className="text-sm text-green-600 text-center">
                {successMessage}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !frontIdImage || !backIdImage}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Enviando Documentos..." : "Enviar Documentos"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  <Link
                    href="/dashboard"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Volver al Dashboard
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
