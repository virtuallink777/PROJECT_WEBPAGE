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

interface ExtractedData {
  userId: string;
  id: string;
  images: { url: string }[];
  email: string;
  shippingDateValidate: string;
  responseUrls: Record<string, string>;
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
    {
      userId: string;
      id: string;
      images: { url: string }[];
      email: string;
      shippingDateValidate: string;
      responseUrls: Record<string, string>;
    }[]
  >([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Estado para almacenar las URLs de las imágenes agrandadas
  const [activeImages, setActiveImages] = useState<string[]>([]);

  useEffect(() => {
    // ✅ Verificar si el socket ya está conectado antes de llamarlo
    if (!socket.connected) {
      socket.connect();
    }

    // se llama a la funcion para obtener el id del admin
    async function fetchAndStoreUserId() {
      await guardarUserId(); // Primero obtenemos y guardamos el userId

      const storedUserId = localStorage.getItem("userId");
      console.log("📌 userId en localStorage:", storedUserId);
      if (storedUserId) {
        setUserId(storedUserId);

        console.log("Enviando evento identificar-admin con:", {
          adminId: storedUserId,
          email: "luiscantorhitchclief@gmail.com",
        });

        socket.emit("identificar-admin", {
          adminId: storedUserId,
          email: "luiscantorhitchclief@gmail.com",
        });
        console.log("📩 Enviando 'identificar-admin' con ID:", {
          storedUserId,
        });
      } else {
        console.log("❌ No se encontró userId en localStorage.");
      }
    }
    fetchAndStoreUserId();

    return () => {
      // 🔹 Asegurar que el socket se desconecte cuando el componente se desmonte
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []); // ✅ Solo ejecuta esto al montar el componente

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
        `http://localhost:4004/api/state-publication/`,
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

  //ELIMINAR LA PUBLICACION ACEPTADA O RECHAZADA *** falta programarla

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
                  const imageUrl = img.url.startsWith("/uploads")
                    ? `http://localhost:4004${img.url}`
                    : img.url;

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
