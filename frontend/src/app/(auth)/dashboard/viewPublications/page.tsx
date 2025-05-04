"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { io } from "socket.io-client";
import useSocket from "@/hooks/useSocket";
import calculateRotationTime from "@/components/calculateRotationTime";
import calculateEndDate from "@/components/calculateEndDate";
import { Button } from "@/components/ui/button";
import ChatReceptor from "@/components/ChatReceptor";
import parseBackendDate from "@/lib/parseBackendDate";
import { useRouter } from "next/navigation";

const socket = io("http://localhost:4004");

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
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA"; // 👈 Agregado
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
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dataPay, setDataPay] = useState<{ [key: string]: any }>({});
  const [canCreateMorePublications, setCanCreateMorePublications] =
    useState(true);
  const socketPay = useSocket("http://localhost:4004");
  const [clientId, setClientId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

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

  // 🔹efecto  Conectar al socket cuando el componente se monta
  useEffect(() => {
    // 🔹 Obtener userId del localStorage
    const storedUserId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    socket.emit("identificar-usuario", storedUserId);

    setUserId(storedUserId);

    // 🔹 Escuchar cambios en publicaciones DE LA APROBACION DEL ADMIN
    socket.on("actualizar-publicacion", ({ id, estado, razon }) => {
      setPublications((prevPublications) =>
        prevPublications.map((pub) =>
          pub._id === id ? { ...pub, estado, razon } : pub
        )
      );
    });
  }, []);

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
      } catch (error: any) {
        console.error("Error al cargar publicaciones:", error);

        // Si el error es por autenticación, redirigir
        if (error.response?.status === 401) {
          router.push("/sign-in"); // o la ruta que corresponda
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

  // alimentar la informacion del pago y de la rotacion de las publicaciones
  useEffect(() => {
    if (!socketPay) return;
    const handleDataPayPublication = (data) => {
      if (data.id) {
        console.log("dataPayPublication:", data);
        setDataPay((prevDataPay) => ({
          ...prevDataPay,
          [data.id]: data,
        }));
      }
    };

    // 🔹 Verifica si ya hay un listener antes de agregar uno nuevo
    if (!socketPay.hasListeners("dataPayPublication")) {
      socketPay.on("dataPayPublication", handleDataPayPublication);
    }

    socketPay.emit("requestDataPayPublication");

    return () => {
      socketPay.off("dataPayPublication", handleDataPayPublication);
    };
  }, [socketPay]);

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
        `http://localhost:4004/api/updatePublicationsEndTop`,
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
  }, []);

  // delete publication
  const handleDeletePublication = async (id: string) => {
    console.log("Eliminar publicación con ID:", id);
    if (!id) {
      console.error("No hay una publicación para eliminar");
      return;
    }
    const confirmDelete = window.confirm(
      "¿Estás seguro(a) de eliminar la publicación? Si esta publicación tiene pago, se perderá."
    );
    if (!confirmDelete) return; // Si el usuario cancela, no hace nada

    try {
      const res = await fetch(`/api/delete-publication/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        throw new Error("Error al eliminar la publicación");
      }
      if (res.status === 200) {
        const data = await res.json();
        console.log("Publicación eliminada:", data);
        // Actualiza la lista de publicaciones después de la eliminación
        const updatedPublications = publications.filter(
          (pub) => pub._id !== id
        );
        setPublications(updatedPublications);
        alert("Publicación eliminada exitosamente");
      }
    } catch (error) {
      console.error("Error al eliminar la publicación:", error);
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

  const baseURL = "http://localhost:4004";
  console.log("Renderizando publicaciones:", publications);

  const publicationsWithPayment = publications.map((pub) => {
    const payData = dataPay[pub._id] || {};
    return {
      ...pub,
      ...payData,
    };
  });

  console.log("publicationsWithPayment", publicationsWithPayment);

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
              {" "}
              {/* Ajusta el tamaño aquí */}
              <Image
                src={
                  pub.images[0]?.url
                    ? `${baseURL}${pub.images[0].url}`
                    : "/default-image.png"
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

                <p className="text-gray-700 mt-2 line-clamp-3">
                  Estado:{" "}
                  {pub.estado === "APROBADA" ? (
                    <span className="text-green-500 font-semibold  text-end">
                      APROBADA ✅
                    </span>
                  ) : pub.estado === "RECHAZADA" ? (
                    <span className="text-red-500 font-semibold line-clamp-4">
                      RECHAZADA ❌ - Motivo: {pub.razon}, Por favor intenta de
                      nuevo
                    </span>
                  ) : (
                    <span className="text-blue-500 font-semibold">
                      Pendiente de activación por validación ⏳
                    </span>
                  )}
                </p>

                <p className="text-gray-700 mt-2 line-clamp-2">
                  {pub.estado === "RECHAZADA" ? (
                    <Link
                      href={`/dashboard/validateRejected/${pub.userId}/${pub._id}`}
                      passHref
                    >
                      <span
                        className="text-blue-500 cursor-pointer hover:underline"
                        onMouseDown={() =>
                          console.log("Validando:", pub.userId, pub._id)
                        }
                      >
                        Valida Nuevamente tu publicidad
                      </span>
                    </Link>
                  ) : null}
                </p>

                <div className="text-gray-700 mt-2  text-center">
                  {pub.estado === "PENDIENTE" ||
                  pub.estado === "RECHAZADA" ? null : (
                    <>
                      {pub.publication?.status ? ( // ✅ Verifica si existe información de pago para esta publicación
                        <div>
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
                          <span className="text-blue-500 cursor-pointer hover:underline">
                            PAGAR PUBLICIDAD
                          </span>
                        </Link>
                      )}

                      <div className="text-gray-700 mt-2 line-clamp-2 text-center">
                        {/* Enlace de editar */}
                        <Link href={`/dashboard/editPublication/${pub._id}`}>
                          <span className="text-blue-500 cursor-pointer hover:underline">
                            Edita tu Publicacion
                          </span>
                        </Link>
                      </div>

                      <div>
                        {/* Enlace de editar */}
                        <button
                          onClick={() => handleDeletePublication(pub._id)}
                        >
                          <span className="text-red-600 cursor-pointer hover:underline">
                            Elimina tu Publicacion
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="container relative flex pt-10 flex-col items-center justify-center lg:px-0">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="text-center ">
              <ChatReceptor userId={ownerId} clientId={clientId} />
            </div>

            <div className="text-center"></div>
            <div className="flex flex-col items-center space-y-4 mt-4"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewPublications;
