"use client";
import HandleFileChange from "@/components/DownloadPhoto";
import { getMediaCounts } from "../../editPublication/[id]/page";
import React from "react";
import HandleFileChangeEditPhotosUpload from "@/components/ui/UploadImagesVideosEdit";

// Componente para mostrar el conteo de imágenes y videos
export const CountImagesVideos: React.FC = () => {
  // Llamamos a la función getMediaCounts para obtener los valores
  const { imagesCount, videosCount } = getMediaCounts();

  return (
    <div className="container mx-auto mt-6">
      <div className="text-center">
        <h1 className="text-2xl">
          En estos momentos tienes:
          <span className="ml-2">
            <b className="font-semibold">{imagesCount}</b> imágenes
          </span>
          <span className="ml-2">
            <b className="font-semibold"> {videosCount}</b> videos guardados
          </span>
        </h1>
        <h2 className="mt-4">
          Recuerda que puedes tener máximo 12 imágenes y 4 videos
        </h2>
      </div>
    </div>
  );
};

const UploadImagesVideos = () => {
  const [formData, setFormData] = React.useState({
    images: [],
    fotoPrincipal: "",
  });
  return (
    <>
      <div>
        <CountImagesVideos />
      </div>
      <div className="container mx-auto mt-6">
        {/* Subir Fotos */}
        <HandleFileChangeEditPhotosUpload
          onImagesChange={(images, mainPhoto) =>
            setFormData({
              ...formData,
              images: images,
              fotoPrincipal: mainPhoto,
            })
          }
        />
      </div>
    </>
  );
};

export default UploadImagesVideos;
