// src/components/WhatsAppLink.tsx (Versión Corregida)

import React from "react";
import { FaWhatsapp } from "react-icons/fa";

type WhatsAppLinkProps = {
  telefono: string;
  postId: string; // Asumo que podrías querer usarlo en el mensaje
  onWhatsAppClick: (postId: string, eventType: "whatsappClicks") => void;
  // Opcional: añadimos una prop para el título de la publicación
  tituloPublicacion?: string;
};

const WhatsAppLink = ({
  telefono,
  postId,
  onWhatsAppClick,
  tituloPublicacion, // Recibimos la nueva prop
}: WhatsAppLinkProps) => {
  // 1. Limpiamos el número de teléfono, como ya lo hacías.
  const formattedTelefono = telefono.replace(/\D/g, "");

  // 2. --- CAMBIO CLAVE: Construimos el mensaje y lo codificamos ---
  //    Definimos un mensaje base. Usamos el título si está disponible.
  const mensajeBase = `¡Hola! Te vi en Lujuria y me interesa tu publicación${
    tituloPublicacion ? `: "${tituloPublicacion}"` : ""
  }.`;

  //    Codificamos el mensaje para que sea seguro en una URL.
  const mensajeCodificado = encodeURIComponent(mensajeBase);

  // 3. --- CAMBIO CLAVE: Creamos la URL completa de WhatsApp con el mensaje ---
  const whatsappLink = `https://wa.me/${formattedTelefono}?text=${mensajeCodificado}`;

  // La función handleWhatsAppClick se mantiene prácticamente igual.
  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Registramos la métrica
    if (onWhatsAppClick && postId) {
      onWhatsAppClick(postId, "whatsappClicks");
    }

    // Abrimos el enlace de WhatsApp en una nueva pestaña.
    // El setTimeout no es estrictamente necesario aquí, pero no hace daño.
    window.open(whatsappLink, "_blank");
  };

  return (
    <div className="flex justify-between items-center">
      <FaWhatsapp className="text-green-500 text-xl mr-2" />
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-700 hover:underline"
        onClick={handleWhatsAppClick}
      >
        {/* Mantenemos el número de teléfono como texto visible del enlace */}
        {telefono}
      </a>
    </div>
  );
};

export default WhatsAppLink;
