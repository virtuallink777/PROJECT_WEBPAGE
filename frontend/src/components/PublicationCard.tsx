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
  images: Image[];
  descripcion: string;
  direccion: string;
  adicionales: string;
  telefono: string;
  status: boolean;
  transactionDate: string;
  selectedTime: string;
  selectedPricing: {
    days: string;
    hours: string;
    price: string;
  };
  transactionTime: string;
}

interface PublicationCardProps {
  publication: IPublication;
  status?: boolean; // ✅ Nueva prop para diferenciar TOP y NO TOP
  isTopSection?: boolean;
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

  // URL del backend
  const backendUrl = "http://localhost:4004";

  // URL de la imagen
  const imageUrl = principalImage
    ? `${backendUrl}${principalImage.url}`
    : "/default-image.png";

  const isActuallyTop = publication.status && isTopSection; // Solo es "realmente TOP" si tiene status=true Y está en sección TOP
  const cardWidth = isActuallyTop ? "20vw" : "18vw";
  const cardHeight = isActuallyTop ? "35vw" : "25vw";

  const handleClick = () => {
    router.push(`/publicationUser/`);
  };

  return (
    <div
      onClick={() => handleClick()}
      className="flex flex-col items-center border border-gray-500 rounded-lg overflow-hidden shadow-sm w-full cursor-pointer transition-transform duration-300 ease-in-out hover:scale-105"
      style={{ width: cardWidth, height: cardHeight }} // ✅ Tamaño variable en vm y vw
    >
      {/* Imagen */}
      <div
        className="w-full"
        style={{ height: "80%" }} // ✅ 80% del contenedor para la imagen
      >
        <Image
          src={imageUrl}
          alt={publication.titulo}
          width={350}
          height={450}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contenido */}
      <div className="p-2 w-full text-center flex-grow flex flex-col justify-center items-center">
        <h3 className="text-sm font-semibold">{publication.nombre}</h3>

        <p className="text-xs text-gray-600">
          {publication.Pais}, {publication.Departamento}
        </p>

        <p className="text-xs text-gray-600">
          {publication.ciudad} - {publication.Localidad}
        </p>
      </div>
    </div>
  );
};

export default PublicationCard;
