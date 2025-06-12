"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import ImageCarousel from "@/components/ImageCarrusel";
import PhoneNumberWithFlag from "@/components/PhoneNumberWithFlag";
import WhatsAppLink from "@/components/WhatsAppLink";
import Chat from "@/components/Chat";

// Define una interfaz para un objeto de imagen individual (basado en tus datos reales)
interface SingleImage {
  url: string;
  filename: string;
  isPrincipal: boolean;
  _id: string;
}

// id dinamico para chat con el propietario
const getOrCreateClientId = () => {
  if (typeof window !== "undefined") {
    let clientId = localStorage.getItem("clientId");
    if (!clientId) {
      clientId = uuidv4();
      localStorage.setItem("clientId", clientId);
    }

    // También guardar en sessionStorage para mayor seguridad
    sessionStorage.setItem("clientId", clientId);
    return clientId;
  }
  return null; // O manejarlo de otra forma
};

interface VideoItem {
  url: string;
  filename: string;
  _id: string;
}

interface IPublication {
  _id: string;
  userId: string;
  nombre: string;
  edad: number;
  telefono: string;
  Categorias: string;
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  direccion: string;
  mostrarEnMaps: boolean;
  titulo: string;
  descripcion: string;
  adicionales: string;
  images: SingleImage[]; // <--- CAMBIO CLAVE: 'images' es un array de 'SingleImage'
  videos: VideoItem[];
  transactionId: string;
  whatsappClicks: string;
  liveChatClicks: number;
}

const PublicacionDetalle = () => {
  const [publicacion, setPublicacion] = useState<IPublication>();
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true); // Estado de carga
  const [isChatOpen, setIsChatOpen] = useState(false); // Estado para controlar si el chat está abierto
  const [conversationId, setConversationId] = useState<string | null>(null);

  // obtenemos el id de la publicacion de los parametros
  const params = useParams();
  const publicationId = params?.id || "";
  const clientId = getOrCreateClientId();

  console.log("publicationId", publicationId);
  console.log("clientId", clientId);

  useEffect(() => {
    if (!publicationId) return;
    const fetchPublicacion = async () => {
      try {
        const response = await fetch(
          `http://localhost:4004/api/publicationsByUserId/${publicationId}`
        );
        if (!response.ok) {
          throw new Error("No se pudo obtener la publicación");
        }

        const data = await response.json();
        setPublicacion(data);
        console.log("publicacion obtenida:", data); // Verifica los datos obtenidos
      } catch (error) {
        console.error("Error al obtener la publicación:", error);
      } finally {
        setLoading(false);
      }
    };

    if (publicationId) {
      fetchPublicacion(); // Solo hace la solicitud si publicationId está definido
    }
  }, [publicationId]);

  console.log("publicacion en render:", publicacion);

  const userId = publicacion?.userId;

  console.log("userId:", userId);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsCarouselOpen(true);
  };

  const closeCarousel = () => {
    setIsCarouselOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  if (!publicacion) {
    return <div>Publicación no encontrada</div>;
  }

  const ownerId = publicacion.userId;
  console.log("ownerId:", ownerId);

  const handleClick = async (
    postId: string,
    eventType: "click" | "whatsappClicks" | "liveChatClicks"
  ) => {
    console.log("📌 handleClick ejecutado con:", { postId, eventType });
    try {
      await fetch("http://localhost:4004/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, eventType }),
      });
    } catch (error) {
      console.error("Error enviando métrica", error);
    }

    console.log(
      `Evento ${eventType} registrado para publicación con ID: ${postId}`
    );
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Encabezado de la publicación */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-400 p-6 text-white">
        <h1 className="text-2xl font-bold">{publicacion?.titulo}</h1>
        <div className="flex items-center mt-2 text-sm opacity-90">
          <a
            href={`https://www.google.com/maps?q=${publicacion?.direccion},${publicacion?.Localidad},${publicacion?.ciudad},${publicacion?.Departamento},${publicacion?.Pais}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer hover:text-blue-500 transition-colors"
          >
            <MapPin className="w-8 h-8 mr-1" />
          </a>
          <span>{`${publicacion?.direccion}, ${publicacion?.Localidad}, ${publicacion?.ciudad}, ${publicacion?.Departamento}, ${publicacion?.Pais}`}</span>
        </div>
      </div>

      {/* Cuerpo principal */}
      <div className="p-6">
        {/* Sección de información personal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Información Personal
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre:</span>
                <span className="font-medium">{publicacion?.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Edad:</span>
                <span className="font-medium">{publicacion?.edad} años</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Categoría:</span>
                <span className="font-medium">{publicacion?.Categorias}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Teléfono:</span>
                <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                  <Phone className="w-4 h-4 mr-1 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    <PhoneNumberWithFlag
                      pais={publicacion?.Pais}
                      telefono={publicacion?.telefono}
                    />
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Whatsapp:</span>
                <WhatsAppLink
                  telefono={publicacion?.telefono}
                  postId={publicacion?._id}
                  onWhatsAppClick={handleClick}
                />
              </div>
              <div>
                {/* Botón "Chatea en vivo" */}
                {publicacion.transactionId ? (
                  <div>
                    {/* Botón "Chatea en vivo" */}
                    <div className="flex justify-between">
                      <button
                        className="text-blue-500 hover:text-blue-700 text-lg font-medium"
                        onClick={() => {
                          handleClick(publicacion._id, "liveChatClicks");
                          setConversationId(`chat-${ownerId}-${clientId}`);
                          setIsChatOpen(true);
                        }}
                      >
                        Chatea en vivo
                      </button>
                    </div>

                    {/* Mostrar el chat si está abierto */}
                    {isChatOpen && conversationId ? (
                      <Chat
                        conversationId={conversationId}
                        userId={clientId}
                        ownerId={ownerId}
                        onClose={() => {
                          console.log("Cerrando chat...");
                          setIsChatOpen(false);
                        }}
                        postId={publicacion?._id}
                        onliveChatClicks={handleClick}
                      />
                    ) : (
                      ""
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-gray-500">
                      **Esta publicacion no tiene chat en vivo**
                    </h3>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Ubicación
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Dirección:</span>
                <span className="font-medium text-right">
                  {publicacion?.direccion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ciudad:</span>
                <span className="font-medium">{publicacion?.ciudad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Departamento:</span>
                <span className="font-medium">{publicacion?.Departamento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">País:</span>
                <span className="font-medium">{publicacion?.Pais}</span>
              </div>
              {publicacion?.Localidad && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Localidad:</span>
                  <span className="font-medium">{publicacion?.Localidad}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Descripción */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Descripción
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg w-full break-words whitespace-normal">
            <p className="text-gray-700">{publicacion?.descripcion}</p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Información Adicional
          </h2>
          <div className="bg-gray-50 p-4 rounded-lg w-full break-words whitespace-normal">
            <p className="text-gray-700">{publicacion?.adicionales}</p>
          </div>
        </div>

        {/* Tabs para imágenes y videos */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 p-4">
            {publicacion?.images?.map((singleImage, index) => (
              <div
                key={singleImage._id} // Usa el _id que es único
                className="relative w-full max-w-[500px] h-120 aspect-video border rounded-lg overflow-hidden bg-gray-200 shadow-sm cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={singleImage.url} // Correcto: singleImage.url existe y es la URL de Cloudinary
                  alt={`Image ${index + 1}`} // o mejor: alt={singleImage.filename || `Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={500}
                  height={500} // Revisa estas dimensiones para el aspect ratio si es necesario
                />
              </div>
            ))}
          </div>
          {isCarouselOpen && publicacion?.images && (
            <ImageCarousel
              images={publicacion.images.map((img) => ({ url: img.url }))} // <--- Transformación aquí
              initialIndex={selectedImageIndex}
              onClose={closeCarousel}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {publicacion?.videos?.map((videos, index) => (
              <div
                key={index}
                className="relative w-full max-w-[500px] h-120 aspect-video border rounded-lg overflow-hidden bg-gray-200 shadow-sm"
              >
                <video
                  src={videos.url}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicacionDetalle;
