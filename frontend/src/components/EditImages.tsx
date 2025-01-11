import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Star } from "lucide-react";

export interface IImageFile {
  url: string;
  isPrincipal: boolean;
  filename: string;
  file?: File;
  id?: string; // Agregamos id para tracking
}

interface ImageManagerProps {
  images: IImageFile[];
  onImagesChange: (images: IImageFile[]) => void;
  maxImages?: number;
  minImages?: number;
}

const ImageManager: React.FC<ImageManagerProps> = ({
  images,
  onImagesChange,
  maxImages = 12,
  minImages = 4,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4004";

  // Validar número mínimo de imágenes y imagen principal
  useEffect(() => {
    if (images.length < minImages) {
      setError(`Debes tener al menos ${minImages} imágenes`);
    } else if (!images.some((img) => img.isPrincipal)) {
      setError("Debes seleccionar una imagen principal");
    } else {
      setError(null);
    }
  }, [images, minImages]);

  // Función para obtener la URL completa
  const getFullImageUrl = (url: string) => {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      return url;
    }
    return `${API_URL}${url}`;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    if (images.length + files.length > maxImages) {
      alert(`Solo puedes subir un máximo de ${maxImages} imágenes`);
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newImages: IImageFile[] = imageFiles.map((file) => ({
      url: URL.createObjectURL(file),
      isPrincipal: false, // Nunca asignamos principal automáticamente
      filename: file.name,
      file: file,
      id: Math.random().toString(36).substr(2, 9), // ID único temporal
    }));

    onImagesChange([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    if (images.length <= minImages) {
      setError(`Debes mantener al menos ${minImages} imágenes`);
      return;
    }

    const newImages = [...images];
    const removedImage = newImages[index];

    if (removedImage.file) {
      URL.revokeObjectURL(removedImage.url);
    }

    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const setPrincipal = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrincipal: i === index,
    }));
    onImagesChange(newImages);
    setError(null); // Limpiar error si había uno de imagen principal
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          id="imageInput"
          onChange={handleFileInput}
          disabled={images.length >= maxImages}
        />
        <label
          htmlFor="imageInput"
          className={`cursor-pointer ${
            images.length >= maxImages ? "opacity-50" : ""
          }`}
        >
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400" />
            <p className="mt-2">
              Arrastra tus imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              Mínimo {minImages} y máximo {maxImages} imágenes
            </p>
            <p className="text-sm text-blue-500 mt-2">
              No olvides seleccionar una imagen principal
            </p>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={image.id || index} className="relative group aspect-square">
            <div className="relative w-full h-full">
              <Image
                src={getFullImageUrl(image.url)}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized={image.file !== undefined}
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg">
              <div className="absolute bottom-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                  disabled={images.length <= minImages}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant={image.isPrincipal ? "default" : "secondary"}
                  size="icon"
                  onClick={() => setPrincipal(index)}
                >
                  <Star className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {image.isPrincipal && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
                Principal
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageManager;
