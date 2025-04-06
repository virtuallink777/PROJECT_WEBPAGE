import React from "react";
import { FaWhatsapp } from "react-icons/fa";

type WhatsAppLinkProps = {
  telefono: string;
  postId: string;
  onWhatsAppClick: (postId: string, eventType: "whatsappClicks") => void;
};

const WhatsAppLink = ({
  telefono,
  postId,
  onWhatsAppClick,
}: WhatsAppLinkProps) => {
  // Asegúrate de que el teléfono tenga el formato correcto (sin espacios ni caracteres especiales)
  const formattedTelefono = telefono.replace(/\D/g, ""); // Elimina todo lo que no sea un dígito

  // Crear el enlace de WhatsApp
  const whatsappLink = `https://wa.me/${formattedTelefono}`;

  // Función para manejar el click en el enlace
  const handleWhatsAppClick = (e) => {
    e.preventDefault(); // Previene la navegación inmediata

    console.log("✅ handleWhatsAppClick ejecutado con postId:", postId);

    if (onWhatsAppClick && postId) {
      onWhatsAppClick(postId, "whatsappClicks");
    }

    // Permitir que el enlace funcione después de un pequeño retraso
    setTimeout(() => {
      window.open(whatsappLink, "_blank");
    }, 100);
  };

  return (
    <div className="flex justify-between items-center">
      {/* Ícono de WhatsApp */}
      <FaWhatsapp className="text-green-500 text-xl mr-2" />
      {/* Enlace de WhatsApp */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-700 hover:underline"
        onClick={handleWhatsAppClick} // Añadido el manejador de eventos
      >
        {telefono}
      </a>
    </div>
  );
};

export default WhatsAppLink;
