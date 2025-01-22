import { useEffect, useState } from "react";
import Image from "next/image";

interface FileChangeProps {
  onImagesChange: (files: File[], mainPhoto: File | null) => void;
}

const HandleFileChangeEditPhotosUpload: React.FC<FileChangeProps> = ({
  onImagesChange,
}) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    const totalFiles = [...photos, ...newFiles];

    if (totalFiles.length > 12) {
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

  const setPrincipalPhoto = (previewUrl: string) => {
    setMainPhoto(previewUrl);
    const mainFile = photos.find(
      (_, index) => photoPreviews[index] === previewUrl
    );

    onImagesChange(photos, mainFile || null);
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

    // Actualizar foto principal
    setMainPhoto((prev) =>
      prev === previewUrl ? photoPreviews[0] || null : prev
    );

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
          Fotos (mínimo 4, máximo 12):
        </label>

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
            Fotos subidas: {photos.length}
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Puedes cargar entre 4 y 12 fotos.
          </p>
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
                  width={400}
                  height={400}
                  layout="responsive"
                />
                <button
                  type="button"
                  onClick={() => setPrincipalPhoto(preview)}
                  className={`absolute bottom-0 left-0 right-0 p-2 text-sm text-center transition-colors ${
                    mainPhoto === preview
                      ? "bg-blue-500 text-white"
                      : "bg-gray-500 bg-opacity-70 text-white hover:bg-blue-500"
                  }`}
                >
                  {mainPhoto === preview ? "Principal" : "Hacer Principal"}
                </button>
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
