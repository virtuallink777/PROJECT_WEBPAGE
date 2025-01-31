"use client";

import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { useCategoriesData } from "../../../../categoriesData/categoriesdata";
import { generateFileHash } from "../../../../lib/hashFile";
import { Button } from "@/components/ui/button";
import VideoUploadComponent from "@/components/DownloadVideo";
import HandleFileChange from "@/components/DownloadPhoto";
import api from "@/lib/api";

interface FormData {
  userId: string;
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
  images: File[];
  fotoPrincipal: File | null;
  videos: File[];
  esMayorDeEdad: boolean;
}

async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    console.log("ID del usuario obtenido:", data.userId); // Este console.log debería aparecer en la consola
    return data.userId; // Esto devuelve directamente el ID alfanumérico
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

const CreatePublications: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    userId: "",
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
    images: [],
    fotoPrincipal: null,
    videos: [],
    esMayorDeEdad: false,
  });

  // Obtenemos el ID del cliente al montar el componente
  useEffect(() => {
    async function fetchUserId() {
      const id = await obtenerIdCliente();
      if (id) {
        setFormData((prev) => ({ ...prev, userId: id }));
        console.log("ID del usuario obtenido:", id); // Este console.log debería aparecer en la consola
      }
    }
    fetchUserId();
  }, []);

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

  const handleVideosChange = (videos: File[]) => {
    if (videos !== formData.videos) {
      setFormData((prev) => ({ ...prev, videos }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.esMayorDeEdad) {
      alert("Debes ser mayor de edad para publicar.");
      return;
    }

    if (!formData.images || formData.images.length < 4) {
      alert("Debes subir al menos 4 fotos.");
      return;
    }

    if (!formData.fotoPrincipal) {
      alert("Por favor, selecciona una foto principal.");
      return;
    }

    const formDataToSend = new FormData();

    try {
      // Generar hashes para las imágenes
      const imageHashes = await Promise.all(
        formData.images.map((image) => generateFileHash(image))
      );

      // Verificar si los hashes ya existen en el backend antes de subirlos
      const hashCheckResponse = await fetch(
        "http://localhost:4004/api/check-hashes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hashes: imageHashes }),
        }
      );
      const hashCheckData = await hashCheckResponse.json();

      if (hashCheckData.existingHashes.length > 0) {
        alert(
          "Algunas de las fotos ya existen en alguna de tus publicaciones, por favor cámbialas."
        );
        return;
      }

      // Si hay videos, verificar duplicados y subirlos

      if (formData.videos && formData.videos.length > 0) {
        const videoHashes = await Promise.all(
          formData.videos.map((video) => generateFileHash(video))
        );

        const videoHashCheckResponse = await fetch(
          "http://localhost:4004/api/check-hashes",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hashes: videoHashes }),
          }
        );
        const videoHashCheckData = await videoHashCheckResponse.json();

        if (videoHashCheckData.existingHashes.length > 0) {
          alert(
            "Algunos videos ya existen en alguna de tus publicaciones, por favor cámbialos."
          );
          return;
        }

        // primero subimos las imagenes
        const imageFormData = new FormData();
        // Añadir la foto principal primero
        imageFormData.append("files", formData.fotoPrincipal);

        // Añadir las demás fotos
        formData.images.forEach((image) => {
          if (image !== formData.fotoPrincipal) {
            imageFormData.append("files", image);
          }
        });

        imageFormData.append("userId", formData.userId);

        // Subir las imagenes primero
        const imageResponse = await fetch(
          `http://localhost:4004/api/publicacionesImage/upload/${formData.userId}`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

        if (!imageResponse.ok) {
          throw new Error("Error al subir las imágenes");
        }

        const imageData = await imageResponse.json();

        // Agregar campos básicos
        Object.entries(formData).forEach(([key, value]) => {
          if (
            key !== "images" &&
            key !== "videos" &&
            key !== "fotoPrincipal" &&
            value != null
          ) {
            formDataToSend.append(key, value.toString());
          }
        });

        // Crear un array para las URLs de las imágenes
        const imageUrls: string[] = [];
        const isPrincipalFlags: string[] = [];

        imageData.files.forEach(
          (file: { url: string; filename: string }, index: number) => {
            imageUrls.push(file.url);
            isPrincipalFlags.push(index === 0 ? "true" : "false");
          }
        );

        // Ahora añadimos todos los valores de una vez
        formDataToSend.append("imageUrls", JSON.stringify(imageUrls));
        formDataToSend.append("isPrincipal", JSON.stringify(isPrincipalFlags));

        // Agregar videos (si hay)
        if (formData.videos && formData.videos.length > 0) {
          console.log("Videos para enviar:", formData.videos);

          // Definimos el tipo de respuesta que esperamos del servidor
          interface VideoResponse {
            message: string;
            files: Array<{
              url: string;
              filename: string;
            }>;
          }

          const videoFormData = new FormData();
          formData.videos.forEach((video) => {
            videoFormData.append("videos", video);
          });

          // enviar videos al backend
          const videoResponse = await fetch(
            `http://localhost:4004/api/publicacionesVideo/upload-videos/${formData.userId}`,
            {
              method: "POST",
              body: videoFormData,
            }
          );

          if (!videoResponse.ok) {
            throw new Error("Error al subir los videos");
          }

          const videoData: VideoResponse = await videoResponse.json();
          console.log("Videos subidos:", videoData);

          // Guardar las URLs de los videos en formDataToSend
          if (videoData.files && videoData.files.length > 0) {
            const videoUrls = videoData.files.map((file) => file.url);
            formDataToSend.append("videoUrls", JSON.stringify(videoUrls));
          }
        }

        console.log("Verificando datos antes de enviar:");
        for (const pair of formDataToSend.entries()) {
          console.log(pair[0] + ": " + pair[1]);
        }

        // Hacer la petición final para crear la publicación
        const response = await api.post(
          "http://localhost:4004/publications",
          formDataToSend
        );
        console.log("Publicación creada:", response.data);
        alert("¡Publicación creada con éxito!, pasa ahora a validarla.");
        window.location.href = "/dashboard/validate";
      }
    } catch (error) {
      console.error("Error al crear la publicación:", error);
      alert("Error al crear la publicación. Por favor, intenta de nuevo.");
    }
  };

  // Estilos comunes
  const fieldContainerStyle =
    "flex flex-col space-y-2 max-w-2xl max-w-md mx-auto";
  const labelStyle = "text-gray-700 font-semibold";
  const inputStyle = "w-full border border-gray-300 rounded p-2 bg-white";
  const selectStyle = "w-full border border-gray-300 rounded p-2 bg-white";
  const textareaStyle =
    "w-full border border-gray-300 rounded p-2 min-h-[200px] resize-y";
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
          <div className="flex flex-col space-y-2 mx-auto">
            <label htmlFor="titulo" className={labelStyle}>
              Título de la publicación (min:50, max:120):
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
              minLength={50}
              maxLength={120}
            />
            <span className="text-sm text-gray-500">
              {formData.titulo.length}/120 caracteres
            </span>
          </div>

          {/* Descripción de la publicación */}
          <div className="flex flex-col space-y-2 mx-auto">
            <label htmlFor="descripcion" className={labelStyle}>
              Descripción de la publicación (min:200, max:400):
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
          <div className="flex flex-col space-y-2 mx-auto">
            <label htmlFor="adicionales" className={labelStyle}>
              ¿Qué adicionales haces? (min:50, max:300):
            </label>
            <textarea
              id="adicionales"
              name="adicionales"
              className="w-full border border-gray-300 rounded p-2 min-h-[100px] resize-y"
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
          <HandleFileChange
            onImagesChange={(images, mainPhoto) =>
              setFormData({
                ...formData,
                images: images,
                fotoPrincipal: mainPhoto,
              })
            }
          />

          {/* Subir Videos */}

          <VideoUploadComponent onChange={handleVideosChange} />

          {/* Botón de envío */}
          <div className="flex justify-center">
            <Button type="submit" className="min-w-[20rem]">
              Enviar y seguir con la validación
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePublications;
