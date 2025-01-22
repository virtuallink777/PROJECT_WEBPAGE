import { useState, useEffect } from "react";
import Image from "next/image";

interface ImageData {
  url: string;
  isPrincipal: boolean;
  filename: string;
  _id: string;
}

interface FileChangeProps {
  onImagesChange: (files: ImageData[], mainPhoto: string | null) => void;
  images: ImageData[];
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getImageUrl = (url: string) => {
  if (url.startsWith("http")) {
    return url;
  }
  return `${API_URL}${url}`;
};

interface ImageItemProps {
  url: string;
  isPrincipal: boolean;
  alt: string;
  onSetPrincipal: (url: string) => void;
  onRemove: (url: string) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({
  url,
  isPrincipal,
  alt,
  onSetPrincipal,
  onRemove,
}) => (
  <div
    className={`relative aspect-square border rounded-lg overflow-hidden ${
      isPrincipal ? "ring-4 ring-blue-500" : ""
    }`}
  >
    <Image
      src={getImageUrl(url)}
      alt={alt}
      className="w-full h-full object-cover"
      width={400}
      height={400}
    />
    <button
      type="button"
      onClick={() => onSetPrincipal(url)}
      className={`absolute bottom-0 left-0 right-0 p-2 text-sm text-center transition-colors ${
        isPrincipal
          ? "bg-blue-500 text-white"
          : "bg-gray-500 bg-opacity-70 text-white hover:bg-blue-500"
      }`}
    >
      {isPrincipal ? "Principal" : "Hacer Principal"}
    </button>
    <button
      type="button"
      onClick={() => onRemove(url)}
      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
    >
      ×
    </button>
  </div>
);

const MIN_IMAGES = 4; // Número mínimo de imágenes permitidas

const HandleFileChangeEdit: React.FC<FileChangeProps> = ({
  onImagesChange,
  images = [],
}) => {
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);

  // Asegurar que siempre haya una imagen principal al cargar
  useEffect(() => {
    const principalImage = images.find((img) => img.isPrincipal);
    if (principalImage) {
      setMainPhoto(principalImage.url);
    } else if (images.length > 0) {
      const updatedImages = images.map((img, index) => ({
        ...img,
        isPrincipal: index === 0,
      }));
      setMainPhoto(updatedImages[0].url);
      onImagesChange(updatedImages, updatedImages[0].url);
    }
  }, [images, onImagesChange]);

  const handleSetPrincipal = (url: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      isPrincipal: img.url === url,
    }));

    setMainPhoto(url);
    onImagesChange(updatedImages, url);
  };

  const handleRemove = (url: string) => {
    if (images.length <= MIN_IMAGES) {
      alert(
        `Debes dejar un mínimo de ${MIN_IMAGES} fotos. Si deseas eliminar las que tienes, agregas nuevas fotos y despues elimina las que necesites`
      );
      return;
    }

    const updatedImages = images.filter((img) => img.url !== url);

    let newMainPhoto = mainPhoto;
    if (mainPhoto === url) {
      // Si se elimina la imagen principal, asignar otra como principal (si existe)
      if (updatedImages.length > 0) {
        updatedImages[0].isPrincipal = true;
        newMainPhoto = updatedImages[0].url;
      } else {
        newMainPhoto = null;
      }
      setMainPhoto(newMainPhoto);
    }

    onImagesChange(updatedImages, newMainPhoto);
  };

  return (
    <div>
      <p className="text-gray-600 mt-3">Total de fotos: {images.length}</p>

      <div className="w-full">
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {images.map((img) => (
              <ImageItem
                key={img._id}
                url={img.url}
                isPrincipal={img.isPrincipal}
                alt={img.filename}
                onSetPrincipal={handleSetPrincipal}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HandleFileChangeEdit;
