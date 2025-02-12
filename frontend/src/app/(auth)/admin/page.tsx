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
  } | null>(null);

  useEffect(() => {
    socket.on("nueva-publicacion", (data) => {
      const { userId, _id, images, email } = data;
      setPublicacion({ userId, _id, images, email }); // Guardar en el estado
    });

    return () => {
      socket.off("nueva-publicacion");
    };
  }, []);

  return (
    <div className="p-4">
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
          <h3 className="text-lg font-semibold mt-2">Imágenes:</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {publicacion.images.map((img, index) => {
              // Asegurar que la URL comience con el dominio correcto
              const imageUrl = img.url.startsWith("/uploads")
                ? `http://localhost:4004${img.url}`
                : img.url;

              return (
                <Image
                  key={index}
                  src={imageUrl}
                  alt={`Imagen ${index + 1}`}
                  className="w-full object-cover rounded"
                  width={600}
                  height={600}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <p>Esperando publicaciones...</p>
      )}
    </div>
  );
};

export default AdminPanel;
