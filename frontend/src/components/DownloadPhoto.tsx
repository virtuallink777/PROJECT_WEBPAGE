import { useEffect, useState } from "react";
import Image from "next/image";

interface FormData {
  fotos: File[];
  fotoPrincipal: string | null;
}

const HandleFileChange = () => {
  const [formData, setFormData] = useState<FormData>({
    fotos: [],
    fotoPrincipal: null,
  });
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    const totalFiles = [...formData.fotos, ...newFiles];

    if (totalFiles.length < 4) {
      alert("Debes tener al menos 4 fotos en total");
      // Limpiar el input para evitar archivos de menos
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

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

    // Generar previews para las nuevas imágenes manteniendo las existentes
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setPreviews((prev) => [...prev, ...newPreviews]);

    setFormData((prev) => ({
      ...prev,
      fotos: totalFiles,
      fotoPrincipal: prev.fotoPrincipal || newPreviews[0], // Primera foto como principal si no hay una
    }));
  };

  const setPrincipalPhoto = (previewUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      fotoPrincipal: previewUrl,
    }));
  };

  const removePhoto = (previewUrl: string) => {
    setPreviews((prev) => {
      const updatedPreviews = prev.filter((url) => url !== previewUrl);
      URL.revokeObjectURL(previewUrl);
      return updatedPreviews;
    });

    setFormData((prev) => {
      const updatedFotos = prev.fotos.filter(
        (_, index) => previews[index] !== previewUrl
      );

      const newPrincipal =
        prev.fotoPrincipal === previewUrl
          ? previews[0] || null
          : prev.fotoPrincipal;

      return {
        ...prev,
        fotos: updatedFotos,
        fotoPrincipal: newPrincipal,
      };
    });
  };

  // Limpieza de URLs al desmontar el componente
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]); // previews como dependencia

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
            Fotos subidas: {formData.fotos.length}
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Puedes cargar entre 4 y 12 fotos.
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {previews.map((preview, index) => (
            <div
              key={preview}
              className={`relative aspect-square border rounded-lg overflow-hidden ${
                formData.fotoPrincipal === preview ? "ring-4 ring-blue-500" : ""
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
                  formData.fotoPrincipal === preview
                    ? "bg-blue-500 text-white"
                    : "bg-gray-500 bg-opacity-70 text-white hover:bg-blue-500"
                }`}
              >
                {formData.fotoPrincipal === preview
                  ? "Principal"
                  : "Hacer Principal"}
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
      )}
    </div>
  );
};

export default HandleFileChange;
