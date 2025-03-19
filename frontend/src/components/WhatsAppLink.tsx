import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppLink = ({ telefono }) => {
  // Asegúrate de que el teléfono tenga el formato correcto (sin espacios ni caracteres especiales)
  const formattedTelefono = telefono.replace(/\D/g, ""); // Elimina todo lo que no sea un dígito

  // Crear el enlace de WhatsApp
  const whatsappLink = `https://wa.me/${formattedTelefono}`;

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
      >
        {telefono}
      </a>
    </div>
  );
};

export default WhatsAppLink;
