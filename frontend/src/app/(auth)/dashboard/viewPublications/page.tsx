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

// Llamar a la función para obtener y guardar el userId
guardarUserId();

const ViewPublications = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [dataPay, setDataPay] = useState<{ [key: string]: any }>({});
  const socketPay = useSocket("http://localhost:4004");

  // 🔹efecto  Conectar al socket cuando el componente se monta
  useEffect(() => {
    // 🔹 Obtener userId del localStorage
    const storedUserId = localStorage.getItem("userId");
    socket.emit("identificar-usuario", storedUserId);

    console.log("📌 userId en localStorage:", storedUserId);
    setUserId(storedUserId);

    // 🔹 Escuchar cambios en publicaciones
    socket.on("actualizar-publicacion", ({ id, estado, razon }) => {
      console.log("actualizar-publicacion con:", { id, estado, razon });

      setPublications((prevPublications) =>
        prevPublications.map((pub) =>
          pub._id === id ? { ...pub, estado, razon } : pub
        )
      );
    });
  }, []);

  /////

  // Efecto para cargar las publicaciones
  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const _id = await obtenerIdCliente();
        if (!_id) {
          throw new Error("No se pudo obtener el ID del usuario");
        }

        const response = await api.get(`/api/publicationsThumbnails/${_id}`);
        setPublications(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error al cargar publicaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, []);

  // alimentar la informacion del pago y de la rotacion

  useEffect(() => {
    if (!socketPay) return; // ✅ Mueve la condición dentro del hook

    // listen event "dataPayPublication" from server
    socketPay.on("dataPayPublication", (data) => {
      console.log("dataPayPublication:", data);
      setDataPay((prevDataPay) => ({
        ...prevDataPay,
        [data.id]: data, // Asocia el pago a la publicación correcta
      }));
    });

    // request data from the server
    socketPay.emit("requestDataPayPublication");

    return () => {
      socketPay.off("dataPayPublication"); // Limpia el evento al desmontar
    };
  }, [socketPay]);

  // delete publication
  const handleDeletePublication = async () => {
    const id = publications[0]?._id; // Asegura que hay una publicación antes de intentar eliminar
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

  // LOGICA PARA VERIFICAR CUANTAS PUBLICACIONES TIENE GRATIS Y APROBADAS
  const canCreateMorePublications = () => {
    const hasFreePublication = publications.some(
      (pub) => pub.estado === "APROBADA" && !dataPay[pub._id]
    );
    const hasUnpaidApprovedPublications = publications.filter(
      (pub) => pub.estado === "APROBADA" && !dataPay[pub._id]
    ).length;

    // Si ya tiene una publicación gratis y otra aprobada sin pagar, no puede crear más
    return !(hasFreePublication && hasUnpaidApprovedPublications >= 2);
  };
  console.log("dataPay", dataPay);
  const baseURL = "http://localhost:4004";
  console.log("Renderizando publicaciones:", publications);
  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Mis Publicaciones
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publications.map((pub) => (
            <Card
              key={pub._id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
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
                className="w-full h-48 object-cover"
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
                    <span className="text-red-500 font-semibold">
                      RECHAZADA ❌ - Motivo: {pub.razon}, Por favor intenta de
                      nuevo
                    </span>
                  ) : (
                    <span className="text-blue-500 font-semibold">
                      Pendiente de activación por validación ⏳
                    </span>
                  )}
                </p>

                <p className="text-gray-700 mt-2 line-clamp-3">
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
                      {pub.selectedTime ? ( // ✅ Verifica si existe información de pago para esta publicación
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
                              pub.selectedPricing.days
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
                        <button onClick={() => handleDeletePublication()}>
                          {" "}
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
            <div className="text-center "></div>

            <div className="text-center"></div>
            <div className="flex flex-col items-center space-y-4 mt-4">
              <Link
                href="/dashboard/createPublications"
                className="w-full text-lg"
              >
                <Button className="w-full text-lg">Crear Publicaciones</Button>
              </Link>

              <Button className="w-full text-lg">Estadísticas</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewPublications;
