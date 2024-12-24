"use client";

import { Input } from "@/components/ui/input";
import React, { useState, useRef, useEffect } from "react";
import { useCategoriesData } from "../../../../categoriesData/categoriesdata";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import VideoUploadComponent from "./pageDownloadVideo";

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
  fotoPrincipal: string | null;
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
    fotoPrincipal: null,
    videos: [],
    esMayorDeEdad: false,
  });

  const categoriesData = useCategoriesData();
  const [previews, setPreviews] = useState<string[]>([]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const totalFiles = [...formData.fotos, ...newFiles];

    if (totalFiles.length < 4) {
      alert("Debes tener al menos 4 fotos en total.");
      // Limpiar el input para evitar archivos de menos
      if (e.target) {
        e.target.value = "";
      }
      return;
    }
    if (totalFiles.length > 12) {
      alert("El máximo permitido es 12 fotos.");
      // Limpiar el input para evitar archivos de más
      if (e.target) {
        e.target.value = "";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.esMayorDeEdad) {
      alert("Debes ser mayor de edad para publicar");
      return;
    }
    console.log("Datos del formulario:", formData);
    window.location.href = "/dashboard/validate";
  };

  // Estilos comunes
  const fieldContainerStyle =
    "flex flex-col space-y-2 max-w-2xl max-w-md mx-auto";
  const labelStyle = "text-gray-700 font-semibold";
  const inputStyle = "w-full border border-gray-300 rounded p-2 bg-white";
  const selectStyle = "w-full border border-gray-300 rounded p-2 bg-white";
  const textareaStyle =
    "w-full border border-gray-300 rounded p-2 min-h-[100px] resize-y";
  const checkboxContainerStyle = "flex items-center space-x-2";

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primer bloque */}
          <div className="space-y-4">
            {/* Primera fila: Checkbox y Nombre */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="esMayorDeEdad"
                  name="esMayorDeEdad"
                  checked={formData.esMayorDeEdad}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600"
                  required
                />
                <label
                  htmlFor="esMayorDeEdad"
                  className="text-gray-700 font-semibold ml-2"
                >
                  Soy mayor de edad
                </label>
              </div>

              {formData.esMayorDeEdad && (
                <p className="text-sm text-gray-600">
                  Al confirmar que eres mayor de 18 años, aceptas nuestros{" "}
                  <a
                    href="/terminos"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    términos y condiciones
                  </a>
                </p>
              )}
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
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white"
                />
              </div>
            </div>

            {/* Segunda fila: Edad y Teléfono */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="edad"
                  className="text-gray-700 font-semibold block"
                >
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{10}"
                  title="Ingrese un número de teléfono válido de 10 dígitos"
                  className="w-full bg-white"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-500" />

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
              placeholder="Ingresa tu dirección, o un lugar conocido de referencia"
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

          <div className="border-b border-gray-500" />

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
              spellCheck="true"
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
              spellCheck="true"
            />
            <span className="text-sm text-gray-500">
              {formData.adicionales.length}/300 caracteres
            </span>
          </div>

          <div className="border-b border-gray-500" />

          {/* Subir Fotos */}
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
                      formData.fotoPrincipal === preview
                        ? "ring-4 ring-blue-500"
                        : ""
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

          {/* Subir Videos */}

          <VideoUploadComponent />

          {/* Botón de envío */}
          <div className="flex justify-center">
            <Button type="submit" className="min-w-[20rem]">
              Enviar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePublications;
