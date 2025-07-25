"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
//import { io } from "socket.io-client";
//import useSocket from "@/hooks/useSocket";
import calculateRotationTime from "@/components/calculateRotationTime";
import calculateEndDate from "@/components/calculateEndDate";
import { Button } from "@/components/ui/button";

import parseBackendDate from "@/lib/parseBackendDate";
import { useRouter } from "next/navigation";
import { useSocketContext } from "@/context/SocketContext"; // NUEVO -> Importamos nuestro hook del contexto
import axios from "axios";
import ChatManager from "@/components/ChatManager";

// El socket para la comunicación en tiempo real no relacionada con 'api' de Axios// revisar primero
//const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL); // Renombrado para evitar confusión con el hook useSocket

export type PublicationStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA";

// Interfaz para el payload del evento 'actualizar-publicacion'
interface UpdatePayload {
  id: string;
  estado: PublicationStatus;
  razon: string;
}

type Publication = {
  _id: string;
  id: string;
  userId: string;
  nombre: string;
  edad: number;
  titulo: string;
  telefono: string;
  createdAt: Date;
  images: {
    url: string;
  }[];
  estado: PublicationStatus;
  razon?: string; // 👈 Agregado (opcional)
  selectedPricing: {
    days: string;
    hours: string;
    price: string;
  };
  selectedTime: string;
  transactionDate: string;
  transactionTime: string;
  status: boolean;
};

interface IncomingMessage {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

interface StoredMessage {
  senderId: string;
  content: string;
  timestamp: Date;
}

interface DataPayPayload {
  id: string;
  userId: string;
  transactionDate: string;
  transactionTime: string;
}

// Función para obtener el ID del cliente
async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data: { userId: string } = await response.json();
    return data.userId;
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

// Función para guardar el ID del cliente en localStorage
async function guardarUserId() {
  try {
    const userId = await obtenerIdCliente();
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

const ViewPublications = () => {
  // NUEVO -> Obtenemos el socket ÚNICO desde el contexto
  const { socket } = useSocketContext();

  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dataPay, setDataPay] = useState<{ [key: string]: unknown }>({});
  const [canCreateMorePublications, setCanCreateMorePublications] =
    useState(true);
  //const socketPay = useSocket(
  //process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4004"
  //);
  const [clientId, setClientId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [conversations, setConversations] = useState<{
    [conversationId: string]: StoredMessage[];
  }>({});
  const [inputMessages, setInputMessages] = useState<{
    [conversationId: string]: string;
  }>({});
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [unreadConversations, setUnreadConversations] = useState<{
    [convoId: string]: boolean;
  }>({});

  useEffect(() => {
    guardarUserId();
  }, []);

  // efecto para obtener el clientId y ownerId del localStorage
  useEffect(() => {
    const storeClientId =
      typeof window !== "undefined" ? localStorage.getItem("clientId") : null;
    setClientId(storeClientId);

    const storedOwnerId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    setOwnerId(storedOwnerId);
  }, []);

  console.log("clientId:", clientId);
  console.log("ownerId:", ownerId);

  // --- EFECTO 1: SOLO PARA IDENTIFICARSE ---

  // Este efecto se ejecuta una vez cuando el socket está listo.
  useEffect(() => {
    if (!socket) return;

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      // Solo actualizamos el ESTADO aquí.
      // Esto disparará el siguiente useEffect.
      setUserId(storedUserId);
      console.log(`Paso 1: Se ha encontrado el userId local: ${storedUserId}`);
    }
  }, [socket]); // Depende solo de que el socket exista.

  // --- EFECTO 2: SOLO PARA IDENTIFICARSE EN EL SOCKET Y ESCUCHAR EVENTOS ---
  // Este efecto AHORA DEPENDE de 'userId'. Solo se ejecuta cuando 'userId' tiene un valor.
  useEffect(() => {
    // Ahora la guarda es triple: necesitamos el socket, y el userId.
    if (!socket || !userId) return;

    // 1. Ahora que tenemos el userId, nos identificamos en el socket.
    socket.emit("identificar-usuario", userId);
    console.log(`Paso 2: Identificando usuario ${userId} con el socket.`);

    // 2. El handler para la actualización
    const handleUpdate = ({ id, estado, razon }: UpdatePayload) => {
      // --- MICRÓFONO DEL FRONTEND ---
      console.log(
        "VERIFICACIÓN FRONTEND: ¡RECIBIDO! El evento 'actualizar-publicacion' ha llegado."
      );
      console.log("VERIFICACIÓN FRONTEND: Datos recibidos:", {
        id,
        estado,
        razon,
      });
      // --- FIN DEL MICRÓFONO ---
      console.log(
        `Paso 3: EVENTO RECIBIDO 'actualizar-publicacion' para id ${id}.`
      );
      setPublications((currentPublications) =>
        currentPublications.map((pub) =>
          pub._id === id ? { ...pub, estado, razon } : pub
        )
      );
    };

    // 3. Registramos el listener. Ahora estamos seguros de que estamos identificados.
    socket.on("actualizar-publicacion", handleUpdate);
    console.log("Listener para 'actualizar-publicacion' registrado.");

    // 4. La función de limpieza
    return () => {
      socket.off("actualizar-publicacion", handleUpdate);
      console.log("Listener para 'actualizar-publicacion' limpiado.");
    };
  }, [socket, userId]); // <-- LA CLAVE: Ahora depende de 'socket' y 'userId'.

  const router = useRouter();

  // Efecto para cargar las publicaciones
  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const _id = await obtenerIdCliente();
        if (!_id) {
          // Redirige a login si no hay ID
          router.push("/sign-in"); // o la ruta que corresponda
          return;
        }

        const response = await api.get(`/api/publicationsThumbnails/${_id}`);

        setPublications(response.data);
      } catch (error) {
        // PASO 2: Usamos el type guard de Axios
        if (axios.isAxiosError(error)) {
          // Dentro de este bloque, TypeScript sabe que 'error' es un AxiosError.

          // Tu lógica original, ahora segura:
          if (error.response?.status === 404) {
            console.warn(
              "No se encontraron publicaciones para este usuario (error 404)."
            );
            setPublications([]); // Establece un array vacío para que la UI no muestre "cargando" indefinidamente.
          } else if (error.response?.status === 401) {
            // Usamos 'else if' porque un error no puede ser 404 y 401 a la vez.
            console.error("Error 401: No autorizado. Redirigiendo a login.");
            router.push("/sign-in");
          } else {
            // Opcional pero recomendado: Registrar cualquier otro error de API.
            console.error("Error de API no manejado:", error.message);
          }
        } else {
          // Si no es un error de Axios, es algo más (problema de red, error de JS, etc.)
          console.error("Error inesperado al cargar publicaciones:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, [router]); // Dependencia para evitar bucle infinito

  useEffect(() => {
    console.log("Publicaciones actualizadas:", publications);
  }, [publications]);

  // --- LÓGICA DE SOCKETS (AHORA VIVE AQUÍ) ---
  useEffect(() => {
    if (!socket || !ownerId) return;

    console.log(`Socket conectado. Uniendo al usuario ${ownerId} a su sala.`);
    socket.emit("joinRoom", ownerId);

    const handleNewMessage = (message: IncomingMessage) => {
      if (message.receiverId === ownerId) {
        console.log("Mensaje recibido para el dueño:", message);
        setConversations((prev) => {
          const current = prev[message.conversationId] || [];
          const newMessage: StoredMessage = {
            senderId: message.senderId,
            content: message.content,
            timestamp: new Date(message.timestamp),
          };
          return {
            ...prev,
            [message.conversationId]: [...current, newMessage],
          };
        });

        // 2. LÓGICA PARA MARCAR COMO NO LEÍDO (LA PARTE NUEVA)
        // Usamos 'setIsChatOpen' y 'setActiveConversationId' en su forma de callback
        // para obtener su valor más reciente sin necesidad de añadirlos como dependencias.
        setIsChatOpen((isCurrentlyOpen) => {
          setActiveConversationId((currentConvoId) => {
            // La conversación se marca como no leída SI:
            // a) La ventana principal del chat está cerrada (isCurrentlyOpen es false)
            // O b) La ventana está abierta, PERO se está viendo una conversación DIFERENTE.
            if (!isCurrentlyOpen || currentConvoId !== message.conversationId) {
              console.log(
                `Marcando conversación ${message.conversationId} como no leída.`
              );
              setUnreadConversations((prevUnread) => ({
                ...prevUnread,
                [message.conversationId]: true,
              }));
            }

            // Devolvemos el estado sin cambios ya que solo estamos leyendo
            return currentConvoId;
          });
          return isCurrentlyOpen;
        });
      }
    };

    const handleUpdate = ({ id, estado, razon }: UpdatePayload) => {
      console.log(`Evento 'actualizar-publicacion' recibido para id ${id}.`);
      setPublications((prev) =>
        prev.map((pub) => (pub._id === id ? { ...pub, estado, razon } : pub))
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("actualizar-publicacion", handleUpdate);

    return () => {
      console.log("Limpiando listeners de socket en ViewPublications.");
      socket.off("newMessage", handleNewMessage);
      socket.off("actualizar-publicacion", handleUpdate);
    };
  }, [socket, ownerId]);

  // --- FUNCIONES CONTROLADORAS DEL CHAT (AHORA VIVEN AQUÍ) ---
  const sendMessage = (conversationId: string) => {
    const messageContent = inputMessages[conversationId];
    if (!socket || !messageContent?.trim() || !ownerId) return;

    // Lógica para encontrar el receiverId
    const firstMessage = conversations[conversationId]?.[0];
    if (!firstMessage) {
      console.error("No se puede determinar el destinatario.");
      return;
    }
    const receiverId = firstMessage.senderId;

    const messageData = {
      conversationId,
      senderId: ownerId,
      receiverId,
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    console.log("Enviando mensaje:", messageData);
    socket.emit("sendMessage", messageData);

    // Actualización optimista del UI
    const newMessage: StoredMessage = {
      senderId: ownerId,
      content: messageContent,
      timestamp: new Date(),
    };
    setConversations((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }));
    setInputMessages((prev) => ({ ...prev, [conversationId]: "" }));
  };

  const handleInputChange = (conversationId: string, value: string) => {
    setInputMessages((prev) => ({ ...prev, [conversationId]: value }));
  };

  const clearChat = (conversationId: string) => {
    setConversations((prev) => {
      const newConversations = { ...prev };
      delete newConversations[conversationId];
      return newConversations;
    });
  };

  // Nueva función para manejar el clic en una conversación
  const handleConversationSelect = (convoId: string | null) => {
    setActiveConversationId(convoId);

    // Si estamos abriendo una conversación (no volviendo a la lista)
    if (convoId) {
      // Marcamos la conversación como LEÍDA
      setUnreadConversations((prev) => {
        const newUnread = { ...prev };
        delete newUnread[convoId]; // Quitamos el ID de la lista de no leídos
        return newUnread;
      });
    }
  };

  // alimentar la informacion del pago y de la rotacion de las publicaciones
  useEffect(() => {
    if (!socket) return; // NUEVO -> Usamos el socket del contexto
    const handleDataPayPublication = (data: DataPayPayload) => {
      if (data.id) {
        console.log("dataPayPublication:", data);
        setDataPay((prevDataPay) => ({
          ...prevDataPay,
          [data.id]: data,
        }));
      }
    };

    // 🔹 Verifica si ya hay un listener antes de agregar uno nuevo
    if (!socket.hasListeners("dataPayPublication")) {
      // NUEVO
      socket.on("dataPayPublication", handleDataPayPublication);
    }

    socket.emit("requestDataPayPublication"); // NUEVO

    return () => {
      socket.off("dataPayPublication", handleDataPayPublication); // NUEVO
    };
  }, [socket]); // NUEVO -> Dependencia del socket

  // CONTAR PUBLICACIONES NOTOP AL BACKEND PARA QUE SEAN EVALUADAS Y RENDERIZADAS
  useEffect(() => {
    const countUnpaidApprovedPublications = (publications: Publication[]) => {
      return publications.filter(
        (pub) => pub.estado === "APROBADA" && !pub.transactionDate
      ).length;
    };
    const unpaidApprovedCount = countUnpaidApprovedPublications(publications);
    if (unpaidApprovedCount >= 2) {
      setCanCreateMorePublications(false);
      alert(
        "Has alcanzado el límite de publicaciones sin pagar. Por favor, paga alguna de las 2 publicaciones pendientes por pago antes de crear nuevas."
      );
    } else {
      setCanCreateMorePublications(true);
    }
  }, [publications, dataPay]);

  // Efecto para finalizar las publicaciones TOP CUANDO HALLAN TERMINADO EL TIEMPO DE CONTRATACION

  const endTopPublication = async () => {
    try {
      // Filtrar solo publicaciones aprobadas con datos de transacción
      const paidPublications = publications.filter(
        (pub) =>
          pub.estado === "APROBADA" &&
          pub.transactionDate &&
          pub.selectedPricing?.days &&
          pub.selectedPricing?.hours
      );

      paidPublications.forEach((pub) => {
        try {
          const endDateString = calculateEndDate(
            pub.transactionDate,
            pub.selectedPricing.days,
            pub.selectedTime || "12:00 AM",
            pub.selectedPricing.hours
          );

          console.log("Fecha de finalización (string):", endDateString);

          // Parsear la fecha del backend
          const parsedBackendDate = parseBackendDate(endDateString);
          const currentDate = new Date();

          console.log("Fecha de finalización:", parsedBackendDate);
          console.log("Fecha actual:", currentDate);
          console.log(
            `Comparando: End date ${parsedBackendDate} vs Current date ${currentDate}`
          );

          if (parsedBackendDate < currentDate) {
            console.log(
              `Publicación ${pub._id} ha expirado, actualizando estado...`
            );
            updatePublicationStatus(pub._id);
          }
        } catch (error) {
          console.error(`Error procesando publicación ${pub._id}:`, error);
        }
      });
    } catch (error) {
      console.error("Error general en endTopPublication:", error);
    }
  };

  useEffect(() => {
    endTopPublication();
  });

  const updatePublicationStatus = async (_id: string) => {
    console.log("Actualizando estado de la publicación:", _id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/updatePublicationsEndTop`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({ _id }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al actualizar la publicación");
      }

      const result = await response.json();
      console.log("Estado actualizado:", result);
    } catch (error) {
      console.error("Error al actualizar la publicación:", error);
    }
  };

  // Efecto para verificar publicaciones finalizadas
  useEffect(() => {
    if (publications.length > 0) {
      // Solo ejecutar si hay publicaciones
      endTopPublication();
    }
    // eslint-disable-next-line
  }, []);

  // delete publication
  const handleDeletePublication = async (id: string) => {
    console.log("Eliminar publicación con ID:", id);
    if (!id) {
      console.error("No hay una publicación para eliminar");
      alert("No se puede eliminar la publicación: ID no encontrado.");
      return;
    }
    const confirmDelete = window.confirm(
      "¿Estás seguro(a) de eliminar la publicación? Si esta publicación tiene pago, se perderá."
    );
    if (!confirmDelete) return; // Si el usuario cancela, no hace nada

    try {
      const res = await api.delete(`/api/delete-publication/`, {
        data: { id }, // Enviamos el ID de la publicación a eliminar
      });
      console.log("Respuesta del backend al eliminar:", res.data);
      // Actualiza la lista de publicaciones en el frontend
      setPublications((prevPublications) =>
        prevPublications.filter((pub) => pub._id !== id)
      );

      // Usa el mensaje del backend si existe, o uno por defecto
      alert(res.data.message || "Publicación eliminada exitosamente");
    } catch (error) {
      console.error(
        "Error en la operación handleDeletePublication (después del interceptor):",
        error
      );

      let errorMessageToShow =
        "Ocurrió un error desconocido al intentar eliminar la publicación.";

      if (axios.isAxiosError(error)) {
        // Dentro de este bloque, TypeScript ya sabe que 'error' es de tipo AxiosError
        // por lo tanto, puedes acceder a error.response, error.message, etc.
        // sin necesidad de un cast adicional 'as AxiosError'.
        if (error.response?.status !== 401) {
          // 'error' aquí ya es tratado como AxiosError
          errorMessageToShow =
            error.response?.data?.message || // Acceso directo
            error.message || // Acceso directo
            `Error del servidor: ${error.response?.status || "desconocido"}`;
          alert(errorMessageToShow);
        }
      } else if (error instanceof Error) {
        errorMessageToShow = error.message;
        alert(errorMessageToShow);
      } else {
        alert(errorMessageToShow);
      }
    }
  };

  // Mostrar un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Cargando...
      </div>
    );
  }

  console.log("dataPay", dataPay);

  console.log(
    "publications: selectedTime ",
    publications.map((pub) => pub.selectedTime)
  );

  console.log("Renderizando publicaciones:", publications);

  const publicationsWithPayment = publications.map((pub) => {
    const payData = dataPay[pub._id] || {};
    return {
      ...pub,
      ...payData,
    };
  });

  console.log("publicationsWithPayment", publicationsWithPayment);

  const razonRechazoCedula =
    "Por favor envia una foto legible por lado y lado de tu documento de identidad original (no fotocopia)";

  return (
    <>
      <div className="container relative flex pt-0 flex-col items-center justify-center lg:px-0 p-4">
        {/* Encabezado con botones a la derecha */}
        <div className="w-full flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold"></h1>

          {/* Botones a la derecha */}
          <div className="flex gap-4 mt-4 mr-4">
            <Link
              href="/dashboard/createPublications"
              className="w-full text-lg"
              onClick={(e) => {
                if (!canCreateMorePublications) {
                  e.preventDefault(); // Evita la navegación si el botón está deshabilitado
                }
              }}
            >
              <Button
                className="w-full text-lg"
                disabled={!canCreateMorePublications}
              >
                Crear Publicaciones
              </Button>
            </Link>
            <Link href="/dashboard/statistics" className="w-full text-lg">
              <Button className="w-full text-lg">Estadísticas</Button>
            </Link>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center">
          Mis Publicaciones
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6  ">
          {publicationsWithPayment.map((pub) => (
            <Card
              key={pub._id}
              className="overflow-hidden hover:shadow-lg transition-shadow lg:w-[20vw] lg:h-[80vh] sm:w-[30vw] sm:h-[90vh] md:w-[20vw] md:h-[115vh]"
            >
              <Image
                src={
                  pub.images[0]?.url ? pub.images[0].url : "/default-image.png"
                }
                width={300}
                height={300}
                alt="ppalImages"
                className="w-30 h-48 object-cover"
              />
              <div className="p-4">
                <p className="text-gray-600">{pub._id}</p>
                <h2 className="font-semibold text-lg mb-2">{pub.nombre}</h2>

                <p className="text-gray-700 mt-2 line-clamp-2">
                  Telefono: {pub.telefono}
                </p>
                <p className="text-gray-700 mt-2 line-clamp-2">
                  Fecha de creación: {""}
                  {new Date(pub.createdAt).toLocaleDateString("es-ES")}
                </p>

                {/* --- Muestra del Estado (Sin cambios) --- */}
                <p className="text-gray-700 mt-2 line-clamp-3">
                  Estado:{" "}
                  {pub.estado === "APROBADA" ? (
                    <span className="text-green-500 font-semibold  text-end">
                      APROBADA ✅
                    </span>
                  ) : pub.estado === "RECHAZADA" ? (
                    <span className="text-red-500 font-semibold line-clamp-6">
                      RECHAZADA ❌ - Motivo: {pub.razon}, Por favor intenta de
                      nuevo
                    </span>
                  ) : (
                    <span className="text-blue-500 font-semibold">
                      Pendiente de activación por validación ⏳
                    </span>
                  )}
                </p>

                {/* ================================================================== */}
                {/*           INICIO DE LA SECCIÓN MODIFICADA Y CORREGIDA            */}
                {/* ================================================================== */}

                <div className="mt-4 flex flex-col items-center space-y-3 text-center">
                  {/* --- CASO 1: Estado APROBADA --- */}
                  {pub.estado === "APROBADA" && (
                    <>
                      {/* Lógica de Pago o Información de Pago */}
                      {pub.transactionDate ? (
                        <div className="text-sm">
                          <p className="text-green-500 font-semibold">
                            TOP CONTRATADO: {pub.selectedPricing.days}
                          </p>
                          <p className="text-gray-600">
                            DESDE: {pub.transactionDate}
                          </p>
                          <p className="text-gray-600">
                            HASTA:{" "}
                            {calculateEndDate(
                              pub.transactionDate,
                              pub.selectedPricing.days,
                              pub.selectedTime,
                              pub.selectedPricing.hours
                            )}
                          </p>
                          <p className="text-gray-600">
                            {calculateRotationTime(
                              pub.selectedTime,
                              pub.selectedPricing
                            )}
                          </p>
                        </div>
                      ) : (
                        <Link href={`/dashboard/payPublication/${pub._id}`}>
                          <span className="text-blue-500 font-bold cursor-pointer hover:underline">
                            PAGAR PUBLICIDAD
                          </span>
                        </Link>
                      )}

                      {/* Acción de Editar */}
                      <Link href={`/dashboard/editPublication/${pub._id}`}>
                        <span className="text-blue-500 cursor-pointer hover:underline">
                          Edita tu Publicacion
                        </span>
                      </Link>

                      {/* Acción de Eliminar */}
                      <button onClick={() => handleDeletePublication(pub._id)}>
                        <span className="text-red-600 cursor-pointer hover:underline">
                          Elimina tu Publicacion
                        </span>
                      </button>
                    </>
                  )}

                  {/* --- CASO 2: Estado PENDIENTE --- */}
                  {pub.estado === "PENDIENTE" && (
                    <>
                      {/* Solo mostrar el botón de eliminar */}
                      <button onClick={() => handleDeletePublication(pub._id)}>
                        <span className="text-red-600 cursor-pointer hover:underline">
                          Elimina tu Publicacion
                        </span>
                      </button>
                    </>
                  )}

                  {/* --- CASO 3: Estado RECHAZADA --- */}
                  {pub.estado === "RECHAZADA" && (
                    <>
                      {/* Solo mostrar el link para validar de nuevo */}
                      {(() => {
                        let targetHref = `/dashboard/validateRejected/${pub.userId}/${pub._id}`;
                        if (pub.razon === razonRechazoCedula) {
                          targetHref = `/dashboard/validateIdentityDocument/${pub.userId}/${pub._id}`;
                        }
                        return (
                          <Link href={targetHref} passHref>
                            <span className="text-blue-500 font-bold cursor-pointer hover:underline">
                              Valida Nuevamente tu publicidad
                            </span>
                          </Link>
                        );
                      })()}
                    </>
                  )}
                </div>

                {/* ================================================================== */}
                {/*             FIN DE LA SECCIÓN MODIFICADA Y CORREGIDA             */}
                {/* ================================================================== */}
              </div>
            </Card>
          ))}
        </div>
        {/* --- SECCIÓN DEL CHAT FLOTANTE --- */}
        {/* --- RENDERIZADO DEL CHAT FLOTANTE --- */}
        {!isChatOpen && ownerId && (
          <button
            onClick={() => setIsChatOpen(true)}
            className={`fixed bottom-4 right-4 z-40 bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-600 ${
              Object.keys(unreadConversations).length > 0 ? "animate-pulse" : ""
            }`}
            aria-label="Abrir chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
        )}

        {isChatOpen && ownerId && (
          <ChatManager
            currentUserId={ownerId}
            conversations={conversations}
            activeConversationId={activeConversationId}
            inputMessages={inputMessages}
            onClose={() => setIsChatOpen(false)}
            onSendMessage={sendMessage}
            onSetActiveConversation={handleConversationSelect}
            unreadConversations={unreadConversations} // <-- Pasamos el estado de no leídos
            onInputChange={handleInputChange}
            onClearChat={clearChat}
          />
        )}
      </div>
    </>
  );
};

export default ViewPublications;
