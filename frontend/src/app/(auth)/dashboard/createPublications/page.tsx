import { Input } from "@/components/ui/input";
import React from "react";
import { useCategoriesData } from "../../../../categoriesData/categoriesdata";

const CreatePublications = () => {
  const categoriesData = useCategoriesData();

  return (
    <div className="container w-full h-full grid grid-cols-1 justify-items-start">
      <div className="text-center pt-5 pl-5">
        <h1 className="text-2xl mb-6">
          Para crear una nueva publicación Ingresa los siguientes datos:
        </h1>
        <form className="space-y-4">
          {/* Campo Nombre */}
          <div className="flex items-center">
            <label
              htmlFor="nombre"
              className="text-gray-700 font-semibold w-32"
            >
              Nombre:
            </label>
            <Input
              id="nombre"
              className="border border-gray-300 rounded p-2 w-80"
              type="text"
              placeholder="Nombre artístico"
            />
          </div>
          {/* Campo Edad */}
          <div className="flex items-center">
            <label htmlFor="edad" className="text-gray-700 font-semibold w-32">
              Edad:
            </label>
            <Input
              id="edad"
              className="border border-gray-300 rounded p-2 w-80"
              type="number"
              placeholder="Edad"
              min={18}
              max={70}
            />
          </div>
          {/* Campo Categorias */}
          <div className="flex items-center">
            <label
              htmlFor="Categorias"
              className="text-gray-700 font-semibold w-32"
            >
              Categorias:
            </label>
            <select
              id="Categorias"
              className="border border-gray-300 rounded p-2 w-80"
              // Agregamos un evento onChange para manejar la selección...por hacer
            >
              <option value="" className="text-gray-400">
                Selecciona una categoría
              </option>
              {categoriesData.Categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label htmlFor="Pais" className="text-gray-700 font-semibold w-32">
              Pais:
            </label>
            <select
              id="Categorias"
              className="border border-gray-300 rounded p-2 w-80"
              // Agregamos un evento onChange para manejar la selección...por hacer
            >
              <option value="" className="text-gray-400">
                Selecciona un Pais
              </option>
              {categoriesData.countries.map((countries) => (
                <option key={countries} value={countries}>
                  {countries}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePublications;
