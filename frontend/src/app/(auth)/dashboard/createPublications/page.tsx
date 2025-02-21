"use client";

import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { useCategoriesData } from "../../../../categoriesData/categoriesdata";

import { Button } from "@/components/ui/button";
import VideoUploadComponent from "@/components/DownloadVideo";
import HandleFileChange from "@/components/DownloadPhoto";
import api from "@/lib/api";

import DuplicateFilesPopup from "@/components/ShowImageVideoCreatePub";
import { useRouter } from "next/navigation";

interface FormData {
  email: string;
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

// Función para obtener el ID del cliente
async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    console.log("ID del usuario obtenido:", data.userId);
    console.log("email:", data.email); // Este console.log debería aparecer en la consola
    return data.userId; // Esto devuelve directamente el ID alfanumérico
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

//funcion para obtener el email del cliente
async function obtenerEmailCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    console.log("email:", data.email); // Este console.log debería aparecer en la consola
    return data.email; // Esto devuelve directamente el ID alfanumérico
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

const CreatePublications: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
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
  const [error, setError] = useState<string>("");
  const [duplicateFiles, setDuplicateFiles] = useState<
    { filename: string; filePath: string }[]
  >([]);

  const router = useRouter();

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

  // obtenemos el email del cliente al montar el componente
  useEffect(() => {
    async function fetchUserEmail() {
      const email = await obtenerEmailCliente();
      if (email) {
        setFormData((prev) => ({ ...prev, email: email }));
        console.log("email del usuario obtenido:", email); // Este console.log debería aparecer en la consola
      }
    }
    fetchUserEmail();
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

  useEffect(() => {
    console.log("Nuevo estado de duplicateFiles:", duplicateFiles);
  }, [duplicateFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    console.log("primer CONSOLE.LOG DE HANDLESUBMIT", formData);

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

    try {
      const formDataToSend = new FormData();

      // Crear un único FormData para todos los archivos
      const combinedFormData = new FormData();

      // Subir imágenes
      combinedFormData.append("files", formData.fotoPrincipal);
      combinedFormData.append("type", "image"); // Indicar que es una imagen

      if (Array.isArray(formData.images)) {
        formData.images.forEach((image) => {
          if (image !== formData.fotoPrincipal) {
            combinedFormData.append("files", image);
            combinedFormData.append("type", "image"); // Indicar que es una imagen
          }
        });
      }

      combinedFormData.append("userId", formData.userId);
      combinedFormData.append("email", formData.email);

      // Subir videos (si hay)
      if (formData.videos && formData.videos.length > 0) {
        if (Array.isArray(formData.videos)) {
          formData.videos.forEach((video) => {
            combinedFormData.append("files", video);
            combinedFormData.append("type", "video"); // Indicar que es un video
          });
        }
      }

      const ResponseImageVideo = await fetch(
        `http://localhost:4004/api/publicacionesImage/upload/${formData.userId}`,
        {
          method: "POST",
          body: combinedFormData,
        }
      );

      // Manejar la respuesta del backend
      const imageData = await ResponseImageVideo.json();
      console.log(
        "Respuesta del backend y se incluye globalDuplicates :",
        imageData
      );

      if (!ResponseImageVideo.ok) {
        console.log(
          "Ejecutando setDuplicateFiles con:",
          imageData.duplicateFiles
        );
        // Si hay archivos duplicados del mismo usuario, mostrar un mensaje al usuario
        if (imageData.duplicateFiles && imageData.duplicateFiles.length > 0) {
          console.log("Nuevos duplicados recibidos:", imageData.duplicateFiles);
          setDuplicateFiles([]); // Limpiar el estado
          setDuplicateFiles([...imageData.duplicateFiles]);
        } else if (
          imageData.globalDuplicates &&
          imageData.globalDuplicates.length > 0
        ) {
          console.log(
            "Nuevos duplicados recibidos de otros usuarios:",
            imageData.globalDuplicates
          );
          setDuplicateFiles([]); // Limpiar el estado
          setDuplicateFiles([...imageData.globalDuplicates]);
        }
        return; // Detener el proceso si hay duplicados
      }

      // Verificar que imageData.uploadedFiles exista y tenga datos
      if (!imageData.uploadedFiles || !Array.isArray(imageData.uploadedFiles)) {
        throw new Error("No se recibieron archivos subidos desde el backend.");
      }

      // Si no hay duplicados, continuar con el proceso
      // Separar las URLs de imágenes y videos
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];
      const isPrincipalFlags: string[] = [];

      imageData.uploadedFiles.forEach(
        (file: { url: string; type: string }, index: number) => {
          if (file.type === "image") {
            imageUrls.push(file.url);
            isPrincipalFlags.push(index === 0 ? "true" : "false"); // Marcar la primera imagen como principal
          } else if (file.type === "video") {
            videoUrls.push(file.url);
          }
        }
      );

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

      // Agregar las URLs de imágenes y videos al FormData
      formDataToSend.append("imageUrls", JSON.stringify(imageUrls));
      formDataToSend.append("isPrincipal", JSON.stringify(isPrincipalFlags));
      formDataToSend.append("videoUrls", JSON.stringify(videoUrls));

      // Hacer la petición final para crear la publicación
      const response = await api.post(
        "http://localhost:4004/publications",
        formDataToSend
      );
      console.log("Publicación creada:", response.data);
      alert("¡Publicación creada con éxito!, pasa ahora a validarla.");

      //enviar las imagenes al sessionStorage

      const dataToStorage = {
        userId: response.data.publicacion.userId,
        images: response.data.publicacion.images,
        _id: response.data.publicacion._id,
        email: response.data.publicacion.email,
        updatedAt: response.data.publicacion.updatedAt,
      };

      console.log("dataToStorage:", dataToStorage);

      sessionStorage.setItem("dataToStorage", JSON.stringify(dataToStorage));

      router.push(
        `/dashboard/validate/${formData.userId}/${response.data.publicacion._id}`
      );
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
    <>
      {/*COMPONENTE QUE RENDERIZA LOS DUPLICADOS*/}
      <div>
        {duplicateFiles && duplicateFiles.length > 0 && (
          <DuplicateFilesPopup
            onClose={() => setDuplicateFiles([])}
            duplicateFiles={duplicateFiles}
          />
        )}
      </div>

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
                  {categoriesData.cities[formData.Departamento]?.map(
                    (ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad.replace(/_/g, " ")}
                      </option>
                    )
                  )}
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
                Dirección (opcional, o coloca un lugar conocido cerca de ti):
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

            <VideoUploadComponent
              onChange={(videos) =>
                setFormData({
                  ...formData,
                  videos: videos,
                })
              }
            />

            {/* Botón de envío */}
            <div className="flex justify-center">
              <Button type="submit" className="min-w-[20rem]">
                Enviar y seguir con la validación
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePublications;
