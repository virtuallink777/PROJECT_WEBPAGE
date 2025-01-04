import React, { useRef, useState, useEffect } from "react";

type VideoPreview = {
  id: string;
  url: string;
  file: File;
};

type VideoUploadComponentProps = {
  onChange: (videos: File[]) => void;
};

const VideoUploadComponent: React.FC<VideoUploadComponentProps> = ({
  onChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<VideoPreview[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const files = Array.from(event.target.files);
    const totalCount = videos.length + files.length;

    if (totalCount > 4) {
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
          Videos (opcional, máximo 4):
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            id="videoInput"
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="videoInput"
            className="w-full border p-2 rounded bg-red-300 text-black text-center cursor-pointer hover:bg-red-400 transition-colors"
          >
            Videos subidos: {videos.length}{" "}
            {/* Mostrar la cantidad de videos correctamente */}
          </label>
          <p className="text-sm text-gray-500 mt-1">
            Puedes subir hasta 4 videos.
          </p>
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

export default VideoUploadComponent;
