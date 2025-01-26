import React, { useRef, useState, useEffect } from "react";
import { useMediaCounts } from "@/hooks/useFetchMediaCounts";

type VideoPreview = {
  id: string;
  url: string;
  file: File;
};

type VideoUploadComponentProps = {
  onChange: (videos: File[]) => void;
};

const VideoUploadComponentEdit: React.FC<VideoUploadComponentProps> = ({
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<VideoPreview[]>([]);
  const { videosCount } = useMediaCounts();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const files = Array.from(event.target.files);

    // Verificar si los archivos ya existen
    const nonDuplicateFiles = files.filter(
      (file) => !videos.some((existingFile) => existingFile.name === file.name)
    );

    // Si todos los archivos son duplicados, detener el flujo
    if (nonDuplicateFiles.length === 0) {
      alert("El o Los videos  que estas seleccionando ya están cargados.");
      if (inputRef.current) inputRef.current.value = "";
      return; // Detenemos la ejecución
    }

    // Mostrar un mensaje si algunos archivos son duplicados
    if (nonDuplicateFiles.length < files.length) {
      alert("Algunos videos ya estaban cargados y se han omitido.");
    }

    const totalCount = videos.length + files.length;

    if (totalCount + videosCount > 4) {
      alert("El máximo permitido es 4 videos.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (files.some((file) => !file.type.startsWith("video/"))) {
      alert("Por favor, selecciona solo archivos de video");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const newPreviews = files.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    }));

    setPreviews((current) => [...current, ...newPreviews]);
    setVideos((current) => [...current, ...files]);

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    setPreviews((current) => {
      const toRemove = current.find((p) => p.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      return current.filter((p) => p.id !== id);
    });

    setVideos((current) =>
      current.filter((_, index) => previews[index].id !== id)
    );
  };

  // Usar useEffect para llamar a onChange solo cuando se actualiza el estado de videos
  useEffect(() => {
    if (videos.length > 0) {
      onChange(videos); // Pasamos los videos actualizados al componente padre
    }
  }, [videos, onChange]); // Dependencias correctamente configuradas

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <label className="text-gray-700 font-semibold items-center mb-4 mt-2 flex">
          Videos (máximo 4): llevas un total de:
          <span className="text-red-500 ml-2  mr-2 text-lg ">
            {" "}
            {videos.length + videosCount}
          </span>
          videos
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            id="videoInput"
            name="videos"
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="videoInput"
            className="w-full border p-2 rounded bg-red-300 text-black text-center cursor-pointer hover:bg-red-400 transition-colors"
          >
            Videos subidos: {videos.length}{" "}
            {/* Mostrar la cantidad de videos correctamente */}
          </label>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
          {previews.map((preview) => (
            <div
              key={preview.id}
              className="relative border rounded-lg overflow-hidden bg-gray-100 p-2"
            >
              <video
                src={preview.url}
                controls
                className="w-full h-full object-cover rounded-md"
                style={{ aspectRatio: "16/9" }}
              />
              <button
                type="button"
                onClick={() => handleRemove(preview.id)}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
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

export default VideoUploadComponentEdit;
