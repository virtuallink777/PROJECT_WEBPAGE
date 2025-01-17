import React from "react";
import { Input } from "./ui/input";

interface FormData {
  nombre: string;
  edad: string;
  telefono: string;
}

interface FirstBlockPublicationProps {
  formData: FormData;

  onFormChange: (name: keyof FormData, value: string | boolean) => void;
}

export const FirstBlockPublication: React.FC<FirstBlockPublicationProps> = ({
  formData,

  onFormChange,
}) => {
  return (
    <>
      <div className="space-y-4">
        {/* Checkbox y Nombre */}
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="esMayorDeEdad"
              name="esMayorDeEdad"
              className="h-4 w-4 text-blue-600"
              checked={true}
              readOnly
            />
            <label
              htmlFor="esMayorDeEdad"
              className="text-gray-700 font-semibold ml-2"
            >
              Soy mayor de edad
            </label>
          </div>

          <div>
            <label
              htmlFor="nombre"
              className="text-gray-700 font-semibold block"
            >
              Nombre:
            </label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ingrese su nombre"
              value={formData.nombre}
              onChange={(e) => onFormChange("nombre", e.target.value)}
              required
              className="w-full bg-white"
            />
          </div>
        </div>

        {/* Edad y Teléfono */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="edad" className="text-gray-700 font-semibold block">
              Edad:
            </label>
            <Input
              id="edad"
              name="edad"
              type="number"
              placeholder="Edad"
              min={18}
              max={70}
              value={formData.edad}
              onChange={(e) => onFormChange("edad", e.target.value)}
              required
              className="w-fit bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="telefono"
              className="text-gray-700 font-semibold block"
            >
              Teléfono:
            </label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              placeholder="Ingrese su teléfono"
              value={formData.telefono}
              onChange={(e) => onFormChange("telefono", e.target.value)}
              required
              pattern="[0-9]{10}"
              title="Ingrese un número de teléfono válido de 10 dígitos"
              className="w-full bg-white"
            />
          </div>
        </div>
      </div>
      <div className="border-b border-gray-500 mt-2 mb-2" />
    </>
  );
};
