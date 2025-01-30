import Image from "next/image";
import React from "react";

const ValidateNewPublication = () => {
  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Validación de Publicaciones
        </h1>
        <h2 className="text-lg text-center mb-8">
          Para validar tu publicación, sube una foto tuya como se indica en el
          ejemplo:
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Lado izquierdo: Foto de ejemplo */}
          <div className="flex flex-col items-center">
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <Image
                src="https://via.placeholder.com/300x400?text=Ejemplo%0APersona+con+cartel"
                alt="Ejemplo de validación"
                className="rounded-lg shadow-lg"
                width={300}
                height={400}
              />
            </div>
            <p className="mt-4 text-sm text-gray-600 text-center">
              Ejemplo: Persona sosteniendo un cartel con su número de teléfono y
              fecha.
            </p>
          </div>

          {/* Lado derecho: Subir imagen */}
          <div className="flex flex-col items-center">
            <label
              htmlFor="upload"
              className="block text-center font-medium text-gray-700 mb-4"
            >
              Sube tu imagen:
            </label>
            <div className="border-2 border-dashed border-gray-400 rounded-lg p-8 w-full flex justify-center items-center">
              <input
                type="file"
                id="upload"
                className="hidden"
                accept="image/*"
              />
              <label
                htmlFor="upload"
                className="cursor-pointer text-blue-600 hover:underline"
              >
                Haz clic aquí para subir tu imagen
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidateNewPublication;
