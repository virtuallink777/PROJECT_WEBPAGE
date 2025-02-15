"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4004");

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

  // Estado para almacenar las URLs de las imágenes agrandadas
  const [activeImages, setActiveImages] = useState<string[]>([]);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("publicaciones");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);

          // Asegurar que es un array y que las imágenes están bien formateadas
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
  }, []);

  useEffect(() => {
    socket.on("nueva-publicacion para VALIDAR", (body, responseUrls) => {
      if (!body || !responseUrls) {
        console.error("Datos de publicación a validar no recibidos");
        return;
      }

      const { userId, id, images, email, shippingDateValidate } = body;

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

      setPublicaciones((prevPublicaciones) => {
        const nuevasPublicaciones = [...prevPublicaciones, nuevaPublicacion];

        // Guardar en localStorage
        localStorage.setItem(
          "publicaciones",
          JSON.stringify(nuevasPublicaciones)
        );

        return nuevasPublicaciones;
      });
    });

    return () => {
      socket.off("nueva-publicacion para VALIDAR");
    };
  }, []);

  return (
    <>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Nueva Publicación</h2>
        {publicaciones.length > 0 ? (
          publicaciones.map((publicacion) => (
            <div key={publicacion.id} className="border p-4 rounded shadow">
              <p>
                <strong>Usuario ID:</strong> {publicacion.userId}
              </p>
              <p>
                <strong>Publicación ID:</strong> {publicacion.id}
              </p>
              <p>
                <strong>Email:</strong> {publicacion.email}
              </p>
              <p>
                <strong>Fecha de Envio para validar:</strong>{" "}
                {publicacion.shippingDateValidate}
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
                <Button className="text-xl">APROBADA</Button>
              </div>
              <div className="flex justify-end mb-20">
                <Button className="text-xl">NO APROBADA</Button>
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
