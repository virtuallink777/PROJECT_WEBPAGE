import { useEffect, useState } from "react";
import Image from "next/image";

interface ImageData {
  url: string;
  isPrincipal: boolean;
  filename: string;
  _id: string;
}

interface FileChangeProps {
  onImagesChange: (files: File[], mainPhoto: string | null) => void;
  images: ImageData[];
  existingPhotos?: string[];
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getImageUrl = (url: string, isNewImage: boolean) => {
  if (isNewImage) {
    return url;
  }
  if (url.startsWith("http")) {
    return url;
  }
  return `${API_URL}${url}`;
};

interface ImageItemProps {
  url: string;
  isPrincipal: boolean;
  alt: string;
  isNewImage?: boolean;
  onSetPrincipal: (url: string) => void;
  onRemove: (url: string) => void;
}

const ImageItem: React.FC<ImageItemProps> = ({
  url,
  isPrincipal,
  alt,
  isNewImage = false,
  onSetPrincipal,
  onRemove,
}) => (
  <div
    className={`relative aspect-square border rounded-lg overflow-hidden ${
      isPrincipal ? "ring-4 ring-blue-500" : ""
    }`}
  >
    <Image
      src={getImageUrl(url, isNewImage)}
      alt={alt}
      className="w-full h-full object-cover"
      width={400}
      height={400}
      unoptimized={isNewImage}
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

const HandleFileChangeEdit: React.FC<FileChangeProps> = ({
  onImagesChange,
  existingPhotos = [],
  images = [],
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(() => {
    const dbImages = images.map((img) => img.url);
    return [...dbImages, ...existingPhotos];
  });

  // Inicializar mainPhoto solo con la imagen principal de la BD
  const [mainPhoto, setMainPhoto] = useState<string | null>(() => {
    const principalImage = images.find((img) => img.isPrincipal);
    return principalImage ? principalImage.url : null;
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    const totalFiles = [...photos, ...newFiles];

    if (totalFiles.length + existingPhotos.length > 12) {
      alert("El máximo permitido son 12 fotos");
      if (event.target) event.target.value = "";
      return;
    }

    const invalidFiles = newFiles.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      alert("Por favor, selecciona solo archivos de imagen");
      return;
    }

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    setPhotos((prev) => [...prev, ...newFiles]);

    // No establecer una nueva imagen principal si ya existe una
    if (!mainPhoto) {
      setMainPhoto(newPreviews[0]);
      onImagesChange(totalFiles, newPreviews[0]);
    } else {
      onImagesChange(totalFiles, mainPhoto);
    }
  };

  const handleSetPrincipal = (url: string) => {
    // Desmarcar la imagen principal anterior en images si existe
    const updatedImages = images.map((img) => ({
      ...img,
      isPrincipal: img.url === url,
    }));

    setMainPhoto(url);
    onImagesChange(photos, url);
  };

  const handleRemove = (url: string) => {
    setPhotoPreviews((prev) => {
      const updatedPreviews = prev.filter((preview) => preview !== url);
      if (!existingPhotos.includes(url)) {
        URL.revokeObjectURL(url);
      }
      return updatedPreviews;
    });

    const updatePhotos = photos.filter(
      (_, index) => photoPreviews[index] !== url
    );
    setPhotos(updatePhotos);

    // Si la imagen eliminada era la principal, establecer la primera imagen disponible como principal
    if (mainPhoto === url) {
      const newMainPhoto = images[0]?.url || photoPreviews[0] || null;
      setMainPhoto(newMainPhoto);
      onImagesChange(updatePhotos, newMainPhoto);
    } else {
      onImagesChange(updatePhotos, mainPhoto);
    }
  };

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => {
        if (!existingPhotos.includes(url)) URL.revokeObjectURL(url);
      });
    };
  }, [photoPreviews, existingPhotos]);

  return (
    <>
      <div>
        <label className="text-gray-700 font-semibold items-center mb-4 mt-2 flex">
          Fotos (mínimo 4, máximo 12):
        </label>

        <div className="w-full">
          {(photoPreviews.length > 0 || images.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {/* Imágenes de la BD */}
              {images.map((img) => (
                <ImageItem
                  key={img._id}
                  url={img.url}
                  isPrincipal={mainPhoto === img.url}
                  alt={img.filename}
                  isNewImage={false}
                  onSetPrincipal={handleSetPrincipal}
                  onRemove={handleRemove}
                />
              ))}

              {/* Imágenes nuevas */}
              {photoPreviews
                .filter((preview) => !images.some((img) => img.url === preview))
                .map((preview, index) => (
                  <ImageItem
                    key={preview}
                    url={preview}
                    isPrincipal={mainPhoto === preview}
                    alt={`Preview ${index + 1}`}
                    isNewImage={true}
                    onSetPrincipal={handleSetPrincipal}
                    onRemove={handleRemove}
                  />
                ))}
            </div>
          )}

          <div className="flex flex-col mt-4">
            <div className="relative">
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <label
                htmlFor="fileInput"
                className="w-full border p-2 rounded bg-red-300 text-black text-center cursor-pointer hover:bg-red-400 transition-colors"
              >
                Fotos subidas: {images.length + photoPreviews.length}
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Puedes cargar entre 4 y 12 fotos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HandleFileChangeEdit;
