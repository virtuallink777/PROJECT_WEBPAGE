// components/PublicationCard.tsx
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

interface Image {
  url: string;
  isPrincipal: boolean;
  filename: string;
  _id: string;
}

export interface IPublication {
  Categorias: string;
  _id: string;
  nombre: string;
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  titulo: string;
  images: Image[];
  descripcion: string;
  direccion: string;
  adicionales: string;
  telefono: string;
  status: boolean;
  transactionDate: string;
  selectedTime?: string;
  selectedPricing: {
    days: string;
    hours: string;
    price: string;
  };
  transactionTime?: string | Date;
}

interface PublicationCardProps {
  publication: IPublication;
  status?: boolean; // ✅ Nueva prop para diferenciar TOP y NO TOP
  isTopSection?: boolean;
  onClick?: () => void; // ✅ Nueva prop para manejar el click
}

const PublicationCard: React.FC<PublicationCardProps> = ({
  publication,
  isTopSection,
}) => {
  // Encontrar la imagen principal
  const principalImage =
    publication.images?.find((img) => img.isPrincipal) ||
    publication.images?.[0];

  const router = useRouter();

  // URL de la imagen
  const imageUrl = principalImage?.url // Usa optional chaining por si principalImage es null/undefined
    ? principalImage.url // Si principalImage.url existe, úsala directamente
    : "/default-image.png"; // Sino, usa la imagen por defecto

  console.log("PublicationCard - imageUrl:", imageUrl); // <--- AÑADE ESTO
  console.log("PublicationCard - principalImage:", principalImage); // <--- Y ESTO también es útil

  const isActuallyTop = publication.status && isTopSection; // Solo es "realmente TOP" si tiene status=true Y está en sección TOP
  //const cardWidth = isActuallyTop ? "20vw" : "18vw";
  //const cardHeight = isActuallyTop ? "35vw" : "25vw";

  const handleClick = () => {
    router.push(`/publicationUser/`);
  };

  return (
    // 👇 --- DIV PRINCIPAL CORREGIDO --- 👇
    <div
      className={`
        flex flex-col border border-gray-500 rounded-lg overflow-hidden shadow-sm 
        w-full cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105
        ${isActuallyTop ? "aspect-[9/16]" : "aspect-[3/4]"}
      `}
    >
      {/* Imagen */}
      <div className="relative w-full flex-1">
        {" "}
        {/* flex-1 hace que ocupe el espacio disponible */}
        <Image
          src={imageUrl}
          alt={publication.titulo}
          fill // fill es perfecto para esto
          className="object-cover" // object-cover suele ser mejor que contain para cards
          onClick={handleClick}
        />
      </div>

      {/* Contenido */}
      <div className="p-2 w-full text-center bg-white">
        {" "}
        {/* Le damos un fondo para que se vea bien */}
        <h3 className="text-sm font-semibold truncate">{publication.nombre}</h3>
        <p className="text-xs text-gray-600 truncate">
          {publication.Pais}, {publication.Departamento}
        </p>
        <p className="text-xs text-gray-600 truncate">
          {publication.ciudad} - {publication.Localidad}
        </p>
      </div>
    </div>
  );
};

export default PublicationCard;
