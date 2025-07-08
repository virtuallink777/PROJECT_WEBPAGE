"use client";

import { Button } from "@/components/ui/button";
//import { socket } from "@/lib/socket";

import { useSocketContext } from "@/context/SocketContext"; // NUEVO -> Importamos el hook del contexto

import Image from "next/image";
import { useEffect, useState } from "react";
//import { Socket } from "socket.io-client";

// 🔹 Extender el tipo de Window para incluir 'socket'
//declare global {
//interface Window {
// socket: Socket;
// }
//}

interface PublicationForValidation {
  // Renombré para mayor claridad
  userId: string;
  id: string; // Este es el ID de la publicación
  images: { url: string }[]; // Imágenes originales de la publicidad
  videos?: { url: string }[]; // Opcional: si tienes videos, los añadimos aquí
  email: string;
  shippingDateValidate: string;
  responseUrls: Record<string, string>; // Fotos de cartel/rostro subidas para validación
  estadoActual?: string; // Opcional: para saber si está pendiente, en revisión de ID, etc.

  // NUEVA PROPIEDAD OPCIONAL para las URLs de los documentos de identidad
  identityDocumentUrls?: {
    documentFront: string;
    documentBack: string;
  };
  // Opcional: un campo para indicar el tipo de validación que es, si es necesario
  // validationType?: "PUBLICITY" | "IDENTITY_DOCUMENT";
}

interface Payload {
  userId: string;
  publicationId: string; // ID de la publicación a la que pertenecen estos documentos
  fileUrls: {
    // URLs de documentFront y documentBack
    documentFront: string;
    documentBack: string;
  };
  images?: { url: string }[]; // Imágenes originales de la publicación
  videos?: { url: string }[]; // Si tienes videos, los añadimos aquí
  email?: string; // Email del usuario, opcional
  shippingDateValidate?: string; // Fecha de envío para validar, opcional
  responseUrls?: Record<string, string>; // Fotos de cartel/rostro subidas para validación
}

// Interfaz para los datos que llegan del evento "validate-identity-document"
interface IdentityValidationPayload {
  userId: string;
  publicationId: string; // ID de la publicación a la que pertenecen estos documentos
  //body: any;
  fileUrls: {
    // URLs de documentFront y documentBack
    documentFront: string;
    documentBack: string;
  };
}

interface UpdateStatePublication {
  id: string;
  estado: string;
  razon: string;
}

async function obtenerIdAdmin() {
  try {
    const response = await fetch("/api/userId");
    const data: { userId: string } = await response.json();
    return data.userId;
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

async function guardarUserId() {
  try {
    const userId = await obtenerIdAdmin();
    if (userId) {
      localStorage.setItem("userId", userId);
      console.log("✅ userId guardado en localStorage:", userId);
    } else {
      console.log("⚠️ No se obtuvo un userId válido.");
    }
  } catch (error) {
    console.error("Error al guardar el userId:", error);
  }
}

const AdminPanel = () => {
  // NUEVO -> Obtenemos el socket ÚNICO desde el contexto
  const { socket } = useSocketContext();

  const [publicaciones, setPublicaciones] = useState<
    PublicationForValidation[]
  >([]);
  //const [userId, setUserId] = useState<string | null>(null);

  // Estado para almacenar las URLs de las imágenes agrandadas
  const [activeImages, setActiveImages] = useState<string[]>([]);

  useEffect(() => {
    // NUEVO -> Condición de seguridad, no hacer nada si el socket no está listo
    if (!socket) return;

    //const handleConnect = () => {
    //console.log("ADMIN_FRONTEND: Socket conectado! ID:", socket.id); // <-- Log del ID del socket

    // Ahora que estamos conectados, intentamos identificar al admin
    async function fetchAndIdentifyAdmin() {
      await guardarUserId(); // Obtener y guardar el userId del admin

      const storedUserId = localStorage.getItem("userId");
      console.log(
        "📌 userId en localStorage (después de conectar):",
        storedUserId
      );
      if (storedUserId) {
        //setUserId(storedUserId); // Actualizar estado local si es necesario

        const adminData = {
          adminId: storedUserId,
          email: "luiscantorhitchclief@gmail.com", // O el email real del admin
        };
        console.log(
          "ADMIN_FRONTEND: Enviando 'identificar-admin' con datos:",
          adminData
        );

        socket?.emit("identificar-admin", adminData);
      } else {
        console.log(
          "ADMIN_FRONTEND: ❌ No se encontró userId en localStorage para identificar al admin."
        );
      }
    }
    // Si el socket está conectado, nos identificamos.
    // Si no lo está, el SocketProvider lo conectará y este efecto se re-ejecutará cuando 'socket' cambie de null a una instancia.
    if (socket.connected) {
      fetchAndIdentifyAdmin();
    } else {
      // Opcional: escuchar el evento 'connect' solo para identificarse
      socket.once("connect", fetchAndIdentifyAdmin);
    }

    // Limpieza: quitar el listener por si el componente se desmonta antes de conectar
    return () => {
      socket.off("connect", fetchAndIdentifyAdmin);
    };
  }, [socket]); // NUEVO -> El efecto depende del socket

  // // Función para manejar el clic en una imagen
  // const handleImageClick = (url: string) => {
  //   if (activeImages.includes(url)) {
  //     // Si la imagen ya está activa, la quitamos del estado
  //     setActiveImages(activeImages.filter((activeUrl) => activeUrl !== url));
  //   } else {
  //     // Si la imagen no está activa, la agregamos al estado
  //     setActiveImages([...activeImages, url]);
  //     // Inicializar la posición de la imagen agrandada
  //   }
  // };

  const UpdateStatePublication = async (data: UpdateStatePublication) => {
    const { id, estado, razon } = data;
    console.log("Datos enviados al state-pub:", data);
    try {
      // Llamar a la API para actualizar el estado en la base de datos
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/state-publication/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ estado, razon, id }),
        }
      );
      if (!response.ok) {
        throw new Error("Error al actualizar el estado de la publicación");
      }
      const result = await response.json();
      console.log("Estado actualizado:", result);
      return result;
    } catch (error) {
      console.error("Error al actualizar el estado de la publicación:", error);
    }
  };

  useEffect(() => {
    // Condición de seguridad, no hacer nada si el socket no está listo.
    if (!socket) return;

    // 1. Definimos el handler con la firma correcta: recibe UN solo argumento.
    const handleValidatePublication = (payload: Payload) => {
      console.log(
        "ADMIN_FRONTEND: RECIBIDO 'validate-publication' con payload:",
        payload
      );

      // Verificación de seguridad para asegurar que el payload es válido.
      if (!payload || !payload.publicationId) {
        console.error("Payload de validación inválido recibido del backend.");
        return;
      }

      // 2. Construimos el nuevo objeto para el estado.
      //    Mapeamos directamente las propiedades del 'payload' que nos envía el backend
      //    a la estructura que tu interfaz 'PublicationForValidation' espera.
      const nuevaPublicacion: PublicationForValidation = {
        userId: payload.userId,
        id: payload.publicationId,
        images: payload.images || [], // Las imágenes originales de la publicación
        videos: payload.videos || [], // Si tienes videos, los añadimos aquí
        email: payload.email || "No especificado",
        shippingDateValidate:
          payload.shippingDateValidate || new Date().toISOString(),

        // La propiedad 'responseUrls' de tu estado se llena con 'validationImages' del payload.
        responseUrls: payload.responseUrls || {},

        // Puedes añadir valores por defecto para otras propiedades si es necesario
        estadoActual: "PENDIENTE_VALIDACION",
      };

      console.log(
        "Nueva publicación formateada para añadir al estado:",
        nuevaPublicacion
      );

      // 3. Actualizamos el estado de 'publicaciones'.
      setPublicaciones((prevPublicaciones) => {
        // Evitamos añadir duplicados si el evento llega varias veces.
        const yaExiste = prevPublicaciones.some(
          (p) => p.id === nuevaPublicacion.id
        );
        if (yaExiste) {
          console.log(
            `La publicación ${nuevaPublicacion.id} ya existe en la lista. No se añadirá de nuevo.`
          );
          return prevPublicaciones;
        }

        const nuevasPublicaciones = [...prevPublicaciones, nuevaPublicacion];

        // Actualizamos el localStorage para persistencia.
        localStorage.setItem(
          "publicaciones",
          JSON.stringify(nuevasPublicaciones)
        );

        return nuevasPublicaciones;
      });
    };

    // 4. Registramos el listener en el socket.
    socket.on("validate-publication", handleValidatePublication);
    console.log("Listener para 'validate-publication' registrado.");

    // 5. Devolvemos la función de limpieza para evitar fugas de memoria.
    return () => {
      socket.off("validate-publication", handleValidatePublication);
      console.log("Listener para 'validate-publication' limpiado.");
    };
  }, [socket]); // El efecto depende del socket para registrarse.

  // 🔹 Obtener publicaciones guardadas en localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("publicaciones");

      if (storedData) {
        setPublicaciones(JSON.parse(storedData));
        try {
          const parsedData = JSON.parse(storedData);
          const formattedData = Array.isArray(parsedData)
            ? parsedData.map((pub) => ({
                ...pub,
                images: Array.isArray(pub.images)
                  ? pub.images.map((img: string) =>
                      typeof img === "string" ? { url: img } : img
                    )
                  : [],
              }))
            : [];
          setPublicaciones(formattedData);
        } catch (error) {
          console.error("Error al parsear datos de localStorage:", error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Solo ejecuta esto al montar el componente

  useEffect(() => {
    // NUEVO -> Condición de seguridad
    if (!socket) return;
    const handleIdentityDocumentValidationRequest = async (
      // <--- Convertir a async
      data: IdentityValidationPayload
    ) => {
      console.log(
        "ADMIN_FRONTEND: (useEffect 2) RECIBIDO evento 'validate-identity-document' con datos:",
        data
      );

      if (
        !data.publicationId ||
        !data.fileUrls ||
        !data.fileUrls.documentFront ||
        !data.fileUrls.documentBack
      ) {
        console.error(
          "ADMIN_FRONTEND: (useEffect 2) Datos incompletos en evento 'validate-identity-document'. Faltan publicationId o fileUrls."
        );
        return;
      }

      // Intenta encontrar y actualizar directamente si ya existe
      let publicationFoundInState = false;
      setPublicaciones((prevPublicaciones) => {
        const updated = prevPublicaciones.map((pub) => {
          if (pub.id === data.publicationId) {
            publicationFoundInState = true;
            console.log(
              `ADMIN_FRONTEND: (useEffect 2) Encontrada publicación ${pub.id} en estado. Adjuntando URLs de documentos.`
            );
            return {
              ...pub,
              identityDocumentUrls: data.fileUrls,
              estadoActual: "REVISION_IDENTIDAD",
            };
          }
          return pub;
        });

        if (publicationFoundInState) {
          localStorage.setItem("publicaciones", JSON.stringify(updated));
          console.log(
            "ADMIN_FRONTEND: (useEffect 2) Estado de publicaciones (actualización directa) con documentos:",
            updated
          );
          return updated;
        }
        return prevPublicaciones; // Si no se encontró, devolvemos el estado sin cambios por ahora, se manejará abajo
      });

      // Si la publicación NO se encontró en el estado actual, haz un fetch para obtenerla
      if (!publicationFoundInState) {
        console.log(
          `ADMIN_FRONTEND: (useEffect 2) Publicación ${data.publicationId} no encontrada en estado. Intentando fetch...`
        );
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/editPublications/${data.publicationId}` // Usar data.publicationId
          );

          if (!response.ok) {
            throw new Error(
              `HTTP error! status: ${response.status} al buscar PubID: ${data.publicationId}`
            );
          }

          const fetchedPublicationData = await response.json(); // Asume que esto devuelve un objeto PublicationForValidation o similar
          console.log(
            "ADMIN_FRONTEND: (useEffect 2) Publicación obtenida por fetch:",
            fetchedPublicationData
          );

          // Asegúrate de que fetchedPublicationData tenga la estructura esperada
          // (userId, id, images, email, shippingDateValidate, etc.)
          // y que el 'id' coincida con data.publicationId.

          if (
            fetchedPublicationData &&
            fetchedPublicationData._id === data.publicationId
          ) {
            console.log(
              `ADMIN_FRONTEND: (useEffect 2) IDs coinciden: fetched._id (${fetchedPublicationData._id}) y data.publicationId (${data.publicationId})`
            );
            const publicationWithIdentityDocs: PublicationForValidation = {
              // Mapea las propiedades de fetchedPublicationData a PublicationForValidation
              id: fetchedPublicationData._id, // <--- CAMBIO AQUÍ: Asigna _id a id
              userId: fetchedPublicationData.userId || data.userId, // Prioriza el de fetched, o usa el del evento
              email: fetchedPublicationData.email || "", // Asegurar que email exista
              images: fetchedPublicationData.images || [], // Asegurar que images exista
              // responseUrls podrían venir de fetchedPublicationData o podrías decidir no mezclarlas si son de contextos diferentes
              responseUrls: fetchedPublicationData.responseUrls || {},
              shippingDateValidate:
                fetchedPublicationData.shippingDateValidate || "",

              identityDocumentUrls: data.fileUrls, // Añadir los documentos de identidad del evento
              estadoActual: "REVISION_IDENTIDAD", // Establecer el estado
            };

            // Ahora añade o actualiza esta publicación completa en el estado
            setPublicaciones((prevPublicaciones) => {
              // Evitar duplicados si por alguna razón ahora sí existe (carrera de condiciones)
              const filteredPrev = prevPublicaciones.filter(
                (pub) => pub.id !== publicationWithIdentityDocs.id
              );
              const nuevasPublicaciones = [
                ...filteredPrev,
                publicationWithIdentityDocs,
              ];

              localStorage.setItem(
                "publicaciones",
                JSON.stringify(nuevasPublicaciones)
              );
              console.log(
                "ADMIN_FRONTEND: (useEffect 2) Estado de publicaciones (después de fetch y añadir/actualizar):",
                nuevasPublicaciones
              );
              return nuevasPublicaciones;
            });
          } else {
            console.error(
              `ADMIN_FRONTEND: (useEffect 2) Error: Datos de publicación (${data.publicationId}) obtenidos por fetch no son válidos o ID no coincide.`
            );
          }
        } catch (error) {
          console.error(
            `ADMIN_FRONTEND: (useEffect 2) Error al obtener la publicación ${data.publicationId} por fetch:`,
            error
          );
          // ¿Qué hacer si falla el fetch? ¿Mostrar un error al admin?
          // Podrías añadir una entrada temporal con los datos del evento y marcarla como "incompleta"
        }
      }
    };

    socket.on(
      "validate-identity-document",
      handleIdentityDocumentValidationRequest
    );
    console.log(
      "ADMIN_FRONTEND: (useEffect 2) Oyente para 'validate-identity-document' REGISTRADO."
    );

    return () => {
      socket.off(
        "validate-identity-document",
        handleIdentityDocumentValidationRequest
      );
      console.log(
        "ADMIN_FRONTEND: (useEffect 2) Oyente para 'validate-identity-document' ELIMINADO."
      );
    };
  }, [socket]); // NUEVO -> Dependencia del socket

  const deleteValidatePublication = (id: string) => {
    console.log("ID recibido para eliminar:", id);

    setPublicaciones((prevPublicaciones) => {
      console.log("Publicaciones antes de eliminar:", prevPublicaciones);

      const nuevasPublicaciones = prevPublicaciones.filter(
        (pub) => pub.id !== id
      );

      console.log("Publicaciones después de eliminar:", nuevasPublicaciones);
      return nuevasPublicaciones;
    });

    // Actualizar localStorage
    const storedData = localStorage.getItem("publicaciones");
    console.log("Datos en localStorage antes de eliminar:", storedData);

    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const updatedData = parsedData.filter(
        (pub: { id: string }) => pub.id !== id
      );

      localStorage.setItem("publicaciones", JSON.stringify(updatedData));
      console.log("LocalStorage actualizado:", updatedData);
    }
  };

  return (
    <>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Nueva Publicación</h2>
        {publicaciones.length > 0 ? (
          publicaciones.map((publicacion, index) => (
            <div key={index} className="border p-4 rounded shadow">
              <p>
                <strong>Usuario ID:</strong>{" "}
                {publicacion?.userId || "Desconocido"}
              </p>
              <p>
                <strong>Publicación ID:</strong> {publicacion?.id || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {publicacion?.email || "N/A"}
              </p>
              <p>
                <strong>Fecha de Envio para validar:</strong>{" "}
                {publicacion?.shippingDateValidate || "N/A"}
              </p>

              <h3 className="text-lg font-semibold mt-2">Imágenes:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {publicacion.images.map((img, index) => {
                  const imageUrl = img.url; // Simplemente usa img.url directamente

                  return (
                    <div
                      key={index}
                      className="text-center group relative"
                      //={() => handleImageClick(imageUrl)}
                    >
                      <div className="mx-auto rounded-lg min-w-0 min-h-0">
                        <Image
                          src={imageUrl}
                          alt={`Imagen ${index + 1}`}
                          className={`rounded-lg transition-transform duration-500 ease-in-out ${
                            activeImages.includes(imageUrl)
                              ? "scale-[200%] origin-right-center"
                              : "group-hover:scale-[200%] origin-right-center"
                          }`}
                          width={400}
                          height={400}
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <h3 className="text-lg font-semibold mt-8">
                Imagenes para validar:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {publicacion.responseUrls &&
                  Object.entries(publicacion.responseUrls).map(([key, url]) => (
                    <div
                      key={key}
                      className="text-center group relative"
                      //onClick={() => handleImageClick(url)} // Manejar clic en la imagen
                    >
                      <p className="font-medium capitalize">{key}</p>
                      <div className="mx-auto rounded-lg min-w-0 min-h-0">
                        <Image
                          src={url}
                          alt={key}
                          className={`rounded-lg transition-transform duration-500 ease-in-out ${
                            activeImages.includes(url)
                              ? "scale-[200%] origin-right-center"
                              : "group-hover:scale-[200%] origin-right-center"
                          }`}
                          width={400}
                          height={400}
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                    </div>
                  ))}

                {publicacion.identityDocumentUrls && (
                  <>
                    <h3 className="text-lg font-semibold mt-8">
                      Documentos de Identidad Adjuntos:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {/* Documento Frontal */}
                      <div
                        key={`${publicacion.id}-docFront`} // Clave única
                        className="text-center group relative"
                        //onClick={() =>
                        //handleImageClick(
                        //publicacion.identityDocumentUrls!.documentFront
                        //)
                        //}
                      >
                        <p className="font-medium capitalize">
                          Documento Frontal
                        </p>
                        <div className="mx-auto rounded-lg min-w-0 min-h-0">
                          <Image
                            src={publicacion.identityDocumentUrls.documentFront}
                            alt={`Documento Frontal para Pub ID ${publicacion.id}`}
                            className={`rounded-lg transition-transform duration-500 ease-in-out ${
                              activeImages.includes(
                                publicacion.identityDocumentUrls.documentFront
                              )
                                ? "scale-[600%] origin-right-center"
                                : "group-hover:scale-[600%] origin-right-center"
                            }`}
                            width={600}
                            height={600}
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      </div>

                      {/* Documento Trasero */}
                      <div
                        key={`${publicacion.id}-docBack`} // Clave única
                        className="text-center group relative"
                        // onClick={() =>
                        //   handleImageClick(
                        //     publicacion.identityDocumentUrls!.documentBack
                        //   )
                        // }
                      >
                        <p className="font-medium capitalize">
                          Documento Trasero
                        </p>
                        <div className="mx-auto rounded-lg min-w-0 min-h-0">
                          <Image
                            src={publicacion.identityDocumentUrls.documentBack}
                            alt={`Documento Trasero para Pub ID ${publicacion.id}`}
                            className={`rounded-lg transition-transform duration-500 ease-in-out ${
                              activeImages.includes(
                                publicacion.identityDocumentUrls.documentBack
                              )
                                ? "scale-[600%] origin-right-center"
                                : "group-hover:scale-[600%] origin-right-center"
                            }`}
                            width={600}
                            height={600}
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {/* FIN DEL NUEVO BLOQUE */}
              </div>

              <div className="flex justify-end mb-4">
                <Button
                  className="text-xl"
                  onClick={async () => {
                    try {
                      // Actualizar el estado en la base de datos
                      await UpdateStatePublication({
                        id: publicacion.id,
                        estado: "APROBADA",
                        razon: "",
                      });

                      console.log(
                        "Enviando evento actualizar-publicacion con:",
                        {
                          id: publicacion.id,
                          userId: publicacion.userId,
                          estado: "APROBADA",
                        }
                      );
                      socket?.emit("admin_tomo_decision", {
                        id: publicacion.id,
                        userId: publicacion.userId,
                        estado: "APROBADA",
                        razon: "", // Envía una razón vacía para consistencia
                      });
                      // Eliminar la publicación de la pantalla y del localStorage
                      deleteValidatePublication(publicacion.id);
                    } catch (error) {
                      console.error(
                        "Error al actualizar el estado de la publicación:",
                        error
                      );
                    }
                  }}
                >
                  APROBADA
                </Button>
              </div>
              <div className="flex justify-end mb-20">
                <Button
                  className="text-xl"
                  onClick={async () => {
                    const razonesRechazo = [
                      "la imagen del cartel está muy borrosa",
                      "la fecha del cartel no corresponde",
                      "la imagen está muy lejos",
                      "debe salir medio cuerpo",
                      "el rostro no coincide",
                      "la cara no se distingue bien",
                      "la imagen del rostro es borrosa",
                      "Por favor envia una foto legible por lado y lado de tu documento de identidad original (no fotocopia)",
                    ];

                    const razon = prompt(
                      "Escribe el número de la razón de rechazo:\n" +
                        razonesRechazo
                          .map((r, i) => `${i + 1}. ${r}`)
                          .join("\n")
                    );

                    if (
                      !razon ||
                      isNaN(parseInt(razon)) ||
                      parseInt(razon) < 1 ||
                      parseInt(razon) > razonesRechazo.length
                    ) {
                      alert("Razón inválida");
                      return;
                    }

                    const razonSeleccionada =
                      razonesRechazo[parseInt(razon) - 1];

                    try {
                      // Actualizar el estado en la base de datos
                      await UpdateStatePublication({
                        id: publicacion.id,
                        estado: "RECHAZADA",
                        razon: razonSeleccionada,
                      });

                      // Emitir el evento a través del socket
                      console.log(
                        "Enviando evento actualizar-publicacion con:",
                        {
                          id: publicacion.id,
                          userId: publicacion.userId,
                          estado: "RECHAZADA",
                          razon: razonSeleccionada,
                        }
                      );
                      socket?.emit("admin_tomo_decision", {
                        id: publicacion.id,
                        userId: publicacion.userId,
                        estado: "RECHAZADA",
                        razon: razonSeleccionada,
                      });
                      // Eliminar la publicación de la pantalla y del localStorage
                      deleteValidatePublication(publicacion.id);
                    } catch (error) {
                      console.error("Error al rechazar la publicación:", error);
                    }
                  }}
                >
                  NO APROBADA
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p>No hay publicaciones pendientes por validar.</p>
        )}
      </div>

      <div>
        {/* Renderizar VIDEOS Y QUE SE PUEDAN REPRODUCIR */}

        {publicaciones.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Videos:</h3>

            {publicaciones[0].videos?.map((video, index) => (
              <div
                key={index}
                className="relative w-full max-w-[500px] h-120 aspect-video border rounded-lg overflow-hidden bg-gray-200 shadow-sm"
              >
                <video
                  src={video.url}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPanel;
