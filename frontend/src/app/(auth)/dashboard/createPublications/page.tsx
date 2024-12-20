"use client";

import { Input } from "@/components/ui/input";
import React, { useState, useRef } from "react";
import { useCategoriesData } from "../../../../categoriesData/categoriesdata";

interface FormData {
  nombre: string;
  edad: string;
  telefono: string;
  Categorias: string;
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  direccion: string;
  mostrarEnMaps: boolean;
  titulo: string;
  descripcion: string;
  adicionales: string;
  fotos: File[];
  videos: File[];
  esMayorDeEdad: boolean;
}

const CreatePublications: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    edad: "",
    telefono: "",
    Categorias: "",
    Pais: "",
    Departamento: "",
    ciudad: "",
    Localidad: "",
    direccion: "",
    mostrarEnMaps: false,
    titulo: "",
    descripcion: "",
    adicionales: "",
    fotos: [],
    videos: [],
    esMayorDeEdad: false,
  });

  const fotosInputRef = useRef<HTMLInputElement>(null);
  const videosInputRef = useRef<HTMLInputElement>(null);
  const categoriesData = useCategoriesData();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData((prev) => {
        const newData = { ...prev, [name]: value };
        if (name === "Pais") {
          newData.Departamento = "";
          newData.ciudad = "";
          newData.Localidad = "";
        } else if (name === "Departamento") {
          newData.ciudad = "";
          newData.Localidad = "";
        } else if (name === "ciudad") {
          newData.Localidad = "";
        }
        return newData;
      });
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "fotos" | "videos"
  ) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = type === "fotos" ? 12 : 4;

    if (files.length > maxFiles) {
      alert(`Solo puedes seleccionar hasta ${maxFiles} ${type}`);
      return;
    }

    if (type === "videos") {
      // Validar que sean videos
      const invalidFiles = files.filter(
        (file) => !file.type.startsWith("video/")
      );
      if (invalidFiles.length > 0) {
        alert("Por favor, selecciona solo archivos de video");
        return;
      }
    }

    if (type === "fotos") {
      // Validar que sean imágenes
      const invalidFiles = files.filter(
        (file) => !file.type.startsWith("image/")
      );
      if (invalidFiles.length > 0) {
        alert("Por favor, selecciona solo archivos de imagen");
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [type]: files }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.esMayorDeEdad) {
      alert("Debes ser mayor de edad para publicar");
      return;
    }
    console.log("Datos del formulario:", formData);
  };

  // Estilos comunes
  const fieldContainerStyle = "flex flex-col space-y-2 w-full max-w-md mx-auto";
  const labelStyle = "text-gray-700 font-semibold";
  const inputStyle = "w-full border border-gray-300 rounded p-2";
  const selectStyle = "w-full border border-gray-300 rounded p-2 bg-white";
  const textareaStyle =
    "w-full border border-gray-300 rounded p-2 min-h-[100px] resize-y";
  const checkboxContainerStyle = "flex items-center space-x-2";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Checkbox Mayor de Edad */}
          <div className={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="esMayorDeEdad"
              name="esMayorDeEdad"
              checked={formData.esMayorDeEdad}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600"
              required
            />
            <label htmlFor="esMayorDeEdad" className={labelStyle}>
              Confirmo que soy mayor de edad
            </label>
          </div>

          {/* Campo Nombre */}
          <div className={fieldContainerStyle}>
            <label htmlFor="nombre" className={labelStyle}>
              Nombre:
            </label>
            <Input
              id="nombre"
              name="nombre"
              className={inputStyle}
              type="text"
              placeholder="Ingrese su nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Campo Edad */}
          <div className={fieldContainerStyle}>
            <label htmlFor="edad" className={labelStyle}>
              Edad:
            </label>
            <Input
              id="edad"
              name="edad"
              className={inputStyle}
              type="number"
              placeholder="Ingrese su edad"
              min={18}
              max={70}
              value={formData.edad}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Campo Teléfono */}
          <div className={fieldContainerStyle}>
            <label htmlFor="telefono" className={labelStyle}>
              Teléfono:
            </label>
            <Input
              id="telefono"
              name="telefono"
              className={inputStyle}
              type="tel"
              placeholder="Ingrese su teléfono"
              value={formData.telefono}
              onChange={handleInputChange}
              required
              pattern="[0-9]{10}"
              title="Ingrese un número de teléfono válido de 10 dígitos"
            />
          </div>

          {/* Campo Categorías */}
          <div className={fieldContainerStyle}>
            <label htmlFor="Categorias" className={labelStyle}>
              Categorías:
            </label>
            <select
              id="Categorias"
              name="Categorias"
              className={selectStyle}
              value={formData.Categorias}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona una categoría</option>
              {categoriesData.Categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>

          {/* Campo País */}
          <div className={fieldContainerStyle}>
            <label htmlFor="Pais" className={labelStyle}>
              País:
            </label>
            <select
              id="Pais"
              name="Pais"
              className={selectStyle}
              value={formData.Pais}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecciona un país</option>
              {categoriesData.countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Departamento */}
          {formData.Pais && (
            <div className={fieldContainerStyle}>
              <label htmlFor="Departamento" className={labelStyle}>
                Departamento:
              </label>
              <select
                id="Departamento"
                name="Departamento"
                className={selectStyle}
                value={formData.Departamento}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona un departamento</option>
                {categoriesData.departments[formData.Pais]?.map(
                  (departamento) => (
                    <option key={departamento} value={departamento}>
                      {departamento.replace(/_/g, " ")}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* Campo Ciudad */}
          {formData.Departamento && (
            <div className={fieldContainerStyle}>
              <label htmlFor="ciudad" className={labelStyle}>
                Ciudad:
              </label>
              <select
                id="ciudad"
                name="ciudad"
                className={selectStyle}
                value={formData.ciudad}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una ciudad</option>
                {categoriesData.cities[formData.Departamento]?.map((ciudad) => (
                  <option key={ciudad} value={ciudad}>
                    {ciudad.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campo Localidad */}
          {formData.ciudad && (
            <div className={fieldContainerStyle}>
              <label htmlFor="Localidad" className={labelStyle}>
                Localidad:
              </label>
              <select
                id="Localidad"
                name="Localidad"
                className={selectStyle}
                value={formData.Localidad}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecciona una localidad</option>
                {categoriesData.localities[formData.ciudad]?.map(
                  (localidad) => (
                    <option key={localidad} value={localidad}>
                      {localidad.replace(/_/g, " ")}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {/* Campo Dirección */}
          <div className={fieldContainerStyle}>
            <label htmlFor="direccion" className={labelStyle}>
              Dirección (opcional):
            </label>
            <Input
              id="direccion"
              name="direccion"
              className={inputStyle}
              type="text"
              placeholder="Ingrese su dirección"
              value={formData.direccion}
              onChange={handleInputChange}
            />
          </div>

          {/* Checkbox Google Maps */}
          <div className={checkboxContainerStyle}>
            <input
              type="checkbox"
              id="mostrarEnMaps"
              name="mostrarEnMaps"
              checked={formData.mostrarEnMaps}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="mostrarEnMaps" className={labelStyle}>
              Mostrar dirección en Google Maps
            </label>
          </div>

          {/* Título de la publicación */}
          <div className={fieldContainerStyle}>
            <label htmlFor="titulo" className={labelStyle}>
              Título de la publicación:
            </label>
            <Input
              id="titulo"
              name="titulo"
              className={inputStyle}
              type="text"
              placeholder="Ingrese el título de su publicación"
              value={formData.titulo}
              onChange={handleInputChange}
              required
              minLength={20}
              maxLength={80}
            />
            <span className="text-sm text-gray-500">
              {formData.titulo.length}/80 caracteres
            </span>
          </div>

          {/* Descripción de la publicación */}
          <div className={fieldContainerStyle}>
            <label htmlFor="descripcion" className={labelStyle}>
              Descripción de la publicación:
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              className={textareaStyle}
              value={formData.descripcion}
              onChange={handleInputChange}
              required
              minLength={200}
              maxLength={400}
              placeholder="Describe tu publicación (mínimo 200 caracteres, máximo 400)"
            />
            <span className="text-sm text-gray-500">
              {formData.descripcion.length}/400 caracteres
            </span>
          </div>

          {/* Adicionales */}
          <div className={fieldContainerStyle}>
            <label htmlFor="adicionales" className={labelStyle}>
              ¿Qué adicionales haces?
            </label>
            <textarea
              id="adicionales"
              name="adicionales"
              className={textareaStyle}
              value={formData.adicionales}
              onChange={handleInputChange}
              required
              minLength={50}
              maxLength={300}
              placeholder="Describe los servicios adicionales que ofreces (mínimo 50 caracteres, máximo 300)"
            />
            <span className="text-sm text-gray-500">
              {formData.adicionales.length}/300 caracteres
            </span>
          </div>

          {/* Subir Fotos */}
          <div className={fieldContainerStyle}>
            <label htmlFor="fotos" className={labelStyle}>
              Fotos (máximo 12):
            </label>
            <input
              type="file"
              id="fotos"
              name="fotos"
              ref={fotosInputRef}
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, "fotos")}
              className="w-full"
              required
            />
            <span className="text-sm text-gray-500">
              {formData.fotos.length} fotos seleccionadas
            </span>
          </div>

          {/* Subir Videos */}
          <div className={fieldContainerStyle}>
            <label htmlFor="videos" className={labelStyle}>
              Videos (máximo 4):
            </label>
            <input
              type="file"
              id="videos"
              name="videos"
              ref={videosInputRef}
              accept="video/*"
              multiple
              onChange={(e) => handleFileChange(e, "videos")}
              className="w-full"
              required
            />
            <span className="text-sm text-gray-500">
              {formData.videos.length} videos seleccionados
            </span>
          </div>

          {/* Botón de envío */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-red-200 hover:bg-red-300 text-black font-bold py-2 px-8 rounded w-full"
            >
              Publicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePublications;
