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

interface IPublication {
  _id: string;
  nombre: string;
  titulo: string;
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  images: Image[];

  telefono: string;
  status: boolean;
}

interface PublicationCardProps {
  publication: IPublication;
  status?: boolean; // ✅ Nueva prop para diferenciar TOP y NO TOP
}

const PublicationCard: React.FC<PublicationCardProps> = ({ publication }) => {
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

  console.log(publication);

  const cardWidth = publication.status ? "20vw" : "18vw";
  const cardHeight = publication.status ? "35vw" : "25vw";

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
        <p className="text-xs text-gray-600">{publication.titulo}</p>
        <p className="text-xs text-gray-600">{publication.Pais}</p>
        <p className="text-xs text-gray-600">{publication.Departamento}</p>
        <p className="text-xs text-gray-600">
          {publication.ciudad} - {publication.Localidad}
        </p>
      </div>
    </div>
  );
};

export default PublicationCard;
