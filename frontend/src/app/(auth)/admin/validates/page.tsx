"use client";

import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

// 🔹 Extender el tipo de Window para incluir 'socket'
declare global {
  interface Window {
    socket: Socket;
  }
}

interface PublicationForValidation {
  // Renombré para mayor claridad
  userId: string;
  id: string; // Este es el ID de la publicación
  images: { url: string }[]; // Imágenes originales de la publicidad
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

// Interfaz para los datos que llegan del evento "validate-identity-document"
interface IdentityValidationPayload {
  userId: string;
  publicationId: string; // ID de la publicación a la que pertenecen estos documentos
  body: any;
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
  const [publicaciones, setPublicaciones] = useState<
    PublicationForValidation[]
  >([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Estado para almacenar las URLs de las imágenes agrandadas
  const [activeImages, setActiveImages] = useState<string[]>([]);

  useEffect(() => {
    const handleConnect = () => {
      console.log("ADMIN_FRONTEND: Socket conectado! ID:", socket.id); // <-- Log del ID del socket

      // Ahora que estamos conectados, intentamos identificar al admin
      async function fetchAndIdentifyAdmin() {
        await guardarUserId(); // Obtener y guardar el userId del admin

        const storedUserId = localStorage.getItem("userId");
        console.log(
          "📌 userId en localStorage (después de conectar):",
          storedUserId
        );
        if (storedUserId) {
          setUserId(storedUserId); // Actualizar estado local si es necesario

          const adminData = {
            adminId: storedUserId,
            email: "luiscantorhitchclief@gmail.com", // O el email real del admin
          };
          console.log(
            "ADMIN_FRONTEND: Enviando 'identificar-admin' con datos:",
            adminData
          );
          socket.emit("identificar-admin", adminData);
        } else {
          console.log(
            "ADMIN_FRONTEND: ❌ No se encontró userId en localStorage para identificar al admin."
          );
        }
      }
      fetchAndIdentifyAdmin();
    };

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      console.log("ADMIN_FRONTEND: Socket desconectado, razón:", reason);
    };

    // Registrar los oyentes ANTES de conectar
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Si el socket no está conectado, intentar conectar.
    // Si ya está conectado, el evento 'connect' podría no dispararse de nuevo
    // a menos que se haya desconectado y reconectado.
    // Si ya está conectado y queremos forzar la identificación, podríamos llamar a fetchAndIdentifyAdmin() directamente.
    if (!socket.connected) {
      console.log(
        "ADMIN_FRONTEND: Socket no conectado. Intentando conectar..."
      );
      socket.connect();
    } else {
      // Si ya estaba conectado al montar el componente, disparamos la identificación manualmente.
      // Esto es importante si el componente se monta y el socket ya estaba conectado de una sesión previa
      // o por otra parte de la aplicación.
      console.log("ADMIN_FRONTEND: Socket ya estaba conectado. ID:", socket.id);
      handleConnect(); // Llamar a handleConnect para que ejecute la lógica de identificación
    }

    // Limpieza al desmontar
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      // Considera si realmente quieres desconectar el socket al desmontar este panel
      // o si debe persistir para otras partes de la app.
      // Si solo el AdminPanel usa este socket, entonces sí, desconectar está bien.
      // if (socket.connected) {
      //   socket.disconnect();
      // }
    };
  }, []); // El array de dependencias vacío asegura que se ejecute solo al montar/desmontar

  // Función para manejar el clic en una imagen
  const handleImageClick = (url: string) => {
    if (activeImages.includes(url)) {
      // Si la imagen ya está activa, la quitamos del estado
      setActiveImages(activeImages.filter((activeUrl) => activeUrl !== url));
    } else {
      // Si la imagen no está activa, la agregamos al estado
      setActiveImages([...activeImages, url]);
      // Inicializar la posición de la imagen agrandada
    }
  };

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
    socket.on("validate-publication", (body, responseUrls) => {
      if (!body || !responseUrls) {
        console.error("Datos de publicación a validar no recibidos");
        return;
      }

      console.log("Datos de publicación a validar:", body);
      console.log("URLs de respuesta recibidas:", responseUrls);

      let extractedData = {};

      try {
        if (body["dataItems for sessionStorage"]) {
          console.log(
            "JSON recibido antes de parsear:",
            body["dataItems for sessionStorage"]
          );
          extractedData = JSON.parse(body["dataItems for sessionStorage"]);
        }
      } catch (error) {
        console.error("Error al parsear dataItems for sessionStorage:", error);
        return;
      }

      const { userId, id, images, email, shippingDateValidate } = extractedData;

      const formattedImages = Array.isArray(images)
        ? images.map((img) => (typeof img === "string" ? { url: img } : img))
        : [];

      const nuevaPublicacion = {
        userId,
        id,
        images: formattedImages,
        email,

        shippingDateValidate,
        responseUrls,
      };

      console.log("Nueva publicación recibida:", nuevaPublicacion);

      setPublicaciones((prevPublicaciones) => {
        const nuevasPublicaciones = [...prevPublicaciones, nuevaPublicacion];

        console.log("Nuevas publicaciones:", nuevasPublicaciones);

        // Guardar en localStorage
        localStorage.setItem(
          "publicaciones",
          JSON.stringify(nuevasPublicaciones)
        );

        return nuevasPublicaciones;
      });
    });

    return () => {
      socket.off("validate-publication");
    };
  }, []);

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
                  ? pub.images.map((img) =>
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

  ///   ****************  REVISAR ESTE USEEFFECT ***************** ///

  useEffect(() => {
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
  }, []); // Dependencias: asegúrate de que si usas algo de fuera del useEffect (que cambie) esté aquí.
  // En este caso, como solo usa 'socket' y 'setPublicaciones', el array vacío está bien.

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
                      onClick={() => handleImageClick(imageUrl)}
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
                      onClick={() => handleImageClick(url)} // Manejar clic en la imagen
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
                        onClick={() =>
                          handleImageClick(
                            publicacion.identityDocumentUrls!.documentFront
                          )
                        }
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
                        onClick={() =>
                          handleImageClick(
                            publicacion.identityDocumentUrls!.documentBack
                          )
                        }
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
                      socket.emit("actualizar-publicacion", {
                        id: publicacion.id,
                        userId: publicacion.userId,
                        estado: "APROBADA",
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
                      socket.emit("actualizar-publicacion", {
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

        {/* Renderizar imágenes agrandadas */}
        {activeImages.map((url) => (
          <div key={url} className="fixed z-50 cursor-grab" style={{}}>
            <div
              style={{
                pointerEvents: "none", // Evitar que la imagen interfiera con los eventos de arrastre
              }}
            >
              <Image
                src={url}
                alt="Imagen agrandada"
                className="rounded-lg"
                width={400}
                height={400}
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminPanel;
