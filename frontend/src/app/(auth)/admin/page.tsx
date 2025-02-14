"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4004");

const AdminPanel = () => {
  const [publicacion, setPublicacion] = useState<{
    userId: string;
    _id: string;
    images: { url: string }[];
    email: string;
    createdAt: string;
    responseUrls: Record<string, string>;
  } | null>(null);

  // Estado para almacenar las URLs de las imágenes agrandadas
  const [activeImages, setActiveImages] = useState<string[]>([]);

  // Estado para almacenar la posición de las imágenes agrandadas
  const [imagePositions, setImagePositions] = useState<{
    [url: string]: { x: number; y: number };
  }>({});

  // Estado para controlar qué imagen se está arrastrando
  const [draggingImage, setDraggingImage] = useState<string | null>(null);

  // Función para manejar el clic en una imagen
  const handleImageClick = (url: string) => {
    if (activeImages.includes(url)) {
      // Si la imagen ya está activa, la quitamos del estado
      setActiveImages(activeImages.filter((activeUrl) => activeUrl !== url));
    } else {
      // Si la imagen no está activa, la agregamos al estado
      setActiveImages([...activeImages, url]);
      // Inicializar la posición de la imagen agrandada
      setImagePositions((prev) => ({ ...prev, [url]: { x: 0, y: 0 } }));
    }
  };

  // Función para manejar el inicio del arrastre
  const handleMouseDown = (url: string, e: React.MouseEvent) => {
    e.preventDefault(); // Evitar el comportamiento predeterminado
    setDraggingImage(url);
  };

  // Función para manejar el movimiento del mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingImage) {
      // Actualizar la posición de la imagen que se está arrastrando
      setImagePositions((prev) => ({
        ...prev,
        [draggingImage]: {
          x: e.clientX - 200, // Ajustar el centro de la imagen
          y: e.clientY - 200, // Ajustar el centro de la imagen
        },
      }));
    }
  };

  // Función para manejar el fin del arrastre
  const handleMouseUp = () => {
    setDraggingImage(null);
  };

  useEffect(() => {
    // Verificar si hay datos en localStorage
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("publicacion");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);

          // Asegurar que `images` tenga el formato correcto
          const formattedImages = Array.isArray(parsedData.images)
            ? parsedData.images.map((img: string | { url: string }) =>
                typeof img === "string" ? { url: img } : img
              )
            : [];

          // NO formatear la fecha al guardarla en localStorage
          setPublicacion({ ...parsedData, images: formattedImages });
        } catch (error) {
          console.error("Error al parsear datos de localStorage:", error);
        }
      }
    }

    socket.on("nueva-publicacion para VALIDAR", (body, responseUrls) => {
      if (!body || !responseUrls) {
        console.error("Datos de publicación a validar no recibidos");
        return;
      }
      const { userId, _id, images, email, createdAt } = body;

      // Convertir `images` al formato correcto
      const formattedImages = Array.isArray(images)
        ? images.map((img: string | { url: string }) =>
            typeof img === "string" ? { url: img } : img
          )
        : [];

      const nuevaPublicacion = {
        userId,
        _id,
        images: formattedImages,
        email,
        createdAt,
        responseUrls,
      };

      setPublicacion(nuevaPublicacion);
      localStorage.setItem("publicacion", JSON.stringify(nuevaPublicacion)); // Guardar en localStorage
    });

    return () => {
      socket.off("nueva-publicacion para VALIDAR");
    };
  }, []);

  return (
    <>
      <div
        className="p-4"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <h2 className="text-xl font-bold mb-4">Nueva Publicación</h2>
        {publicacion ? (
          <div className="border p-4 rounded shadow">
            <p>
              <strong>Usuario ID:</strong> {publicacion.userId}
            </p>
            <p>
              <strong>Publicación ID:</strong> {publicacion._id}
            </p>
            <p>
              <strong>Email:</strong> {publicacion.email}
            </p>
            <p>
              <strong>Fecha de Creación:</strong>{" "}
              {publicacion.createdAt
                ? new Date(publicacion.createdAt).toLocaleString("es-CO", {
                    timeZone: "America/Bogota",
                  })
                : "Fecha no disponible"}
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
                    onClick={() => handleImageClick(imageUrl)} // Manejar clic en la imagen
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
          </div>
        ) : (
          <p>No hay publicaciones pendientes.</p>
        )}

        {/* Renderizar imágenes agrandadas */}
        {activeImages.map((url) => (
          <div
            key={url}
            className="fixed z-50 cursor-grab"
            style={{
              transform: `translate(${imagePositions[url]?.x || 0}px, ${
                imagePositions[url]?.y || 0
              }px)`,
            }}
            onMouseDown={(e) => handleMouseDown(url, e)}
          >
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
                draggable="false" // Evitar que el navegador intente arrastrar la imagen
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminPanel;
