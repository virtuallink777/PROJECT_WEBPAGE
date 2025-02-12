import Image from "next/image";
import React, { useState } from "react";

interface DuplicateFilesPopupProps {
  duplicateFiles: { filename: string; filePath: string }[];
  onClose: () => void;
}

const DuplicateFilesPopup: React.FC<DuplicateFilesPopupProps> = ({
  duplicateFiles,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen || duplicateFiles.length === 0) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-3">
          los siguientes Archivos estan duplicados en alguna de tus
          publicaciones, o en otras Publicaciones con otro email, por favor
          eliminalos y sube otros:
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {duplicateFiles.map((file, index) => (
            <div key={index} className="border p-1 rounded-md">
              {file.filename.endsWith(".mp4") ||
              file.filename.endsWith(".webm") ||
              file.filename.endsWith(".ogg") ? (
                <video
                  src={file.filePath}
                  controls
                  className="w-full h-20 object-cover"
                  width={200}
                  height={200}
                />
              ) : (
                <Image
                  src={file.filePath}
                  alt={file.filename}
                  className="w-full h-20 object-cover"
                  width={200}
                  height={200}
                />
              )}
              <p className="text-xs text-center mt-1">{file.filename}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            onClose(); // Notificar al padre que el popup se ha cerrado
          }}
          className="mt-4 w-full bg-red-500 text-white py-2 rounded-md"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default DuplicateFilesPopup;
