import { useEffect, useState } from "react";
import Image from "next/image";
import { useMediaCounts } from "@/hooks/useFetchMediaCounts";

interface FileChangeProps {
  onImagesChange: (files: File[], mainPhoto: File | null) => void;
}

const HandleFileChangeEditPhotosUpload: React.FC<FileChangeProps> = ({
  onImagesChange,
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const { imagesCount } = useMediaCounts();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);

    // Verificar duplicados (por nombre de archivo)
    const nonDuplicateFiles = newFiles.filter(
      (file) => !photos.some((existingFile) => existingFile.name === file.name)
    );

    // Si no hay archivos nuevos (todos son duplicados)
    if (nonDuplicateFiles.length === 0) {
      alert("El o las fotos que estas seleccionando ya estan cargadas.");
      if (event.target) {
        event.target.value = ""; // Limpiar el input
      }
      return;
    }

    // Mostrar mensaje si algunos archivos son duplicados
    if (nonDuplicateFiles.length < newFiles.length) {
      alert("Algunos archivos ya estaban subidos y se han omitido.");
    }

    const totalFiles = [...photos, ...newFiles];

    if (totalFiles.length + imagesCount > 12) {
      alert("El máximo permitido son 12 fotos");
      // Limpiar el input para evitar archivos de más
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    // Validar que sean imágenes
    const invalidFiles = newFiles.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      alert("Por favor, selecciona solo archivos de imagen");
      return;
    }

    // Actualizar previews y estado
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    setPhotos((prev) => [...prev, ...newFiles]);
    setMainPhoto((prev) => prev || newPreviews[0]);

    onImagesChange(totalFiles, newFiles[0] || null); // Notificar al padre
  };

  const removePhoto = (previewUrl: string) => {
    // Eliminar preview y foto correspondiente
    setPhotoPreviews((prev) => {
      const updatedPreviews = prev.filter((url) => url !== previewUrl);
      URL.revokeObjectURL(previewUrl); // Limpieza
      return updatedPreviews;
    });

    setPhotos((prev) =>
      prev.filter((_, index) => photoPreviews[index] !== previewUrl)
    );

    const updatePhotos = photos.filter(
      (_, index) => photoPreviews[index] !== previewUrl
    );
    setPhotos(updatePhotos);

    onImagesChange(updatePhotos, null);
  };

  // Limpieza de URLs al desmontar
  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <label className="text-gray-700 font-semibold items-center mb-4 mt-2 flex">
          Fotos (mínimo 4, máximo 12): llevas un total de:
          <span className="text-red-500 ml-2  mr-2 text-lg ">
            {" "}
            {photos.length + imagesCount}{" "}
          </span>
          fotos
        </label>

        <div className="relative">
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="fileInput"
            className="w-full border p-2 rounded bg-red-300 text-black text-center cursor-pointer hover:bg-red-400 transition-colors"
          >
            Fotos subidas: {photos.length}
          </label>
        </div>
      </div>

      {photoPreviews.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {photoPreviews.map((preview, index) => (
              <div
                key={preview}
                className={`relative aspect-square border rounded-lg overflow-hidden ${
                  mainPhoto === preview ? "ring-4 ring-blue-500" : ""
                }`}
              >
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                  width={300}
                  height={300}
                />

                <button
                  type="button"
                  onClick={() => removePhoto(preview)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HandleFileChangeEditPhotosUpload;
