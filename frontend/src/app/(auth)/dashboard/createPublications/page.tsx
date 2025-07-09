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
import Link from "next/link";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const SimpleSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-xl text-gray-700">Subiendo la información</p>
  </div>
);

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

interface ImageObjectForBackend {
  url: string;
  filename: string; // El que Cloudinary genera (ej: giww7ybd0a0dbtjynjbp.png)
  originalFilename: string; // El nombre original del archivo (ej: Captura de pantalla (1).png)
  isPrincipal: boolean;
  cloudinaryPublicId: string; // El public_id completo de Cloudinary (ej: publicidades/userId/...)
}

interface VideoObjectForBackend {
  url: string;
  filename: string; // El que Cloudinary genera
  originalFilename: string; // El nombre original
  cloudinaryPublicId: string; // El public_id completo de Cloudinary
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

  const [duplicateFiles, setDuplicateFiles] = useState<
    { filename: string; filePath: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true); // Inicia en true para mostrar loader

  const router = useRouter();

  // Unifica los useEffect para cargar datos iniciales
  useEffect(() => {
    async function fetchInitialUserData() {
      setIsLoading(true); // Asegúrate de que está en true al comenzar
      let userId = null;
      let userEmail = null;

      try {
        // Intenta obtener el ID del cliente
        const idResponse = await fetch("/api/userId");

        if (idResponse.status === 401) {
          console.error("No autorizado, redirigiendo a /sign-in");
          // Si la respuesta es 401, redirige al usuario a la página de inicio de sesión
          router.push("/sign-in");
          // Es importante retornar aquí para no seguir ejecutando el código
          return;
        }

        if (!idResponse.ok) {
          console.error(
            "Error en la respuesta de /api/userId (ID):",
            idResponse.status
          );
          // Considera mostrar un error al usuario aquí
        } else {
          const idData = await idResponse.json();
          userId = idData.userId;
          userEmail = idData.email; // Puedes obtener ambos de la misma llamada si la API lo permite
          console.log("ID del usuario obtenido:", userId);
          console.log("Email del usuario obtenido:", userEmail);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        // Considera mostrar un error al usuario aquí
      }

      // Actualiza el formData si los datos se obtuvieron
      if (userId) {
        setFormData((prev) => ({ ...prev, userId }));
      }
      if (userEmail) {
        setFormData((prev) => ({ ...prev, email: userEmail }));
      }

      setIsLoading(false); // Establece en false DESPUÉS de intentar obtener los datos
    }

    fetchInitialUserData();

    // Desactivamos la regla de ESLint porque queremos que este efecto
    // se ejecute UNA SOLA VEZ al montar el componente para verificar la sesión.
    // Añadir 'router' causaría un loop infinito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

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
    setIsLoading(true); // ← Comienza el loading
    console.log("primer CONSOLE.LOG DE HANDLESUBMIT", formData);

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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/publicacionesImage/upload/${formData.userId}`,
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
        setIsLoading(false); // ¡Importante!
        throw new Error("No se recibieron archivos subidos desde el backend.");
      }

      // --- NUEVA LÓGICA: Preparar datos de archivos para enviar a /publications ---
      const imageObjectsForBackend: ImageObjectForBackend[] = [];
      const videoObjectsForBackend: VideoObjectForBackend[] = [];

      // El tipo de 'file' viene de la respuesta de tu endpoint de subida.
      // Asegúrate de que coincide con la estructura real.
      // Asumo que tiene: url, filename (original), type, public_id (completo de Cloudinary)
      imageData.uploadedFiles.forEach(
        (
          file: {
            url: string;
            filename: string;
            type: string;
            public_id: string;
          },
          index: number
        ) => {
          // Extraer el "filename" de Cloudinary (ej: giww7ybd0a0dbtjynjbp.png) del public_id completo
          // El public_id completo es algo como "publicidades/userId/giww7ybd0a0dbtjynjbp" (sin extensión)
          // Necesitamos "giww7ybd0a0dbtjynjbp.png"
          const publicIdParts = file.public_id.split("/");
          const cloudinaryFilenameBase =
            publicIdParts[publicIdParts.length - 1]; // "giww7ybd0a0dbtjynjbp"

          // Obtener la extensión de la URL, ya que public_id no la tiene
          let extension = "";
          const lastDotIndex = file.url.lastIndexOf(".");
          if (lastDotIndex !== -1 && lastDotIndex > file.url.lastIndexOf("/")) {
            // Asegura que el punto es para la extensión
            extension = file.url.substring(lastDotIndex); // ".png" o ".mp4"
          } else {
            console.warn(
              `No se pudo determinar la extensión para el archivo con URL: ${file.url}`
            );
            // Decide un fallback o maneja este caso. Por ahora, podría ser un string vacío.
          }
          const cloudinaryFilenameWithExt = cloudinaryFilenameBase + extension;

          if (file.type === "image") {
            imageObjectsForBackend.push({
              url: file.url,
              filename: cloudinaryFilenameWithExt, // El que Cloudinary usa (ej: randomid.png)
              originalFilename: file.filename, // El nombre original (ej: mi_foto.png)
              isPrincipal: index === 0, // O cómo determines la foto principal
              cloudinaryPublicId: file.public_id, // El public_id completo (ej: carpeta/randomid)
            });
          } else if (file.type === "video") {
            videoObjectsForBackend.push({
              url: file.url,
              filename: cloudinaryFilenameWithExt,
              originalFilename: file.filename,
              cloudinaryPublicId: file.public_id,
            });
          }
        }
      );

      console.log(
        "Objetos de imagen preparados para /publications:",
        imageObjectsForBackend
      );
      console.log(
        "Objetos de video preparados para /publications:",
        videoObjectsForBackend
      );

      // --- Agregar campos básicos al formDataToSend (el que va a /publications) ---
      Object.entries(formData).forEach(([key, value]) => {
        if (
          key !== "images" && // Estos son los File objects, no los enviaremos a /publications
          key !== "videos" && // Estos son los File objects
          key !== "fotoPrincipal" && // Este es un File object
          value != null // Evitar enviar nulls
        ) {
          if (typeof value === "boolean") {
            formDataToSend.append(key, value.toString()); // 'true' o 'false'
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      // --- NUEVA LÓGICA: Agregar los arrays de objetos de archivo al formDataToSend ---
      formDataToSend.append(
        "imagesData",
        JSON.stringify(imageObjectsForBackend)
      );
      formDataToSend.append(
        "videosData",
        JSON.stringify(videoObjectsForBackend)
      );

      // Ya no necesitas enviar imageUrls, isPrincipal, videoUrls por separado
      // porque toda esa información (y más) está dentro de imagesData y videosData.

      // --- Petición final para crear la publicación (a /publications) ---
      console.log("Enviando a /publications con formData:", formDataToSend); // Puedes loguear para ver qué se envía
      // Para inspeccionar FormData, no puedes hacer console.log(formDataToSend) directamente.
      // Tendrías que iterar: for (let [key, value] of formDataToSend.entries()) { console.log(key, value); }

      for (const [key, value] of formDataToSend.entries()) {
        console.log(`FormData para /publications: ${key} =`, value);
      }

      const response = await api.post("/api/publications", formDataToSend);

      console.log(
        "Respuesta de /publications (creación de publicación):",
        response.data
      );
      alert("¡Publicación creada con éxito!, pasa ahora a validarla.");

      // --- Manejo de sessionStorage y redirección (sin cambios) ---
      const dataForValidationPage = {
        // Usamos 'publicationId' para ser consistentes.
        publicationId: response.data.publicacion._id,
        userId: response.data.publicacion.userId,
        email: response.data.publicacion.email,

        // Extraemos SOLO las URLs, que es lo que necesitamos transportar.
        imageUrls: response.data.publicacion.images.map(
          (img: { url: string }) => img.url
        ),
        videoUrls: response.data.publicacion.videos.map(
          (vid: { url: string }) => vid.url
        ),

        // Añadimos la fecha para que la página de validación la tenga.
        shippingDateValidate: new Date().toLocaleString("es-ES"),
      };

      // 2. Guardamos este objeto limpio en sessionStorage.
      sessionStorage.setItem(
        "dataForValidationPage",
        JSON.stringify(dataForValidationPage)
      );

      console.log(
        "Datos guardados en sessionStorage para la página de validación:",
        dataForValidationPage
      );

      // 3. Redirigimos al usuario. La redirección ya es correcta.
      setTimeout(() => {
        router.push(
          `/dashboard/validate/${dataForValidationPage.userId}/${dataForValidationPage.publicationId}`
        );
      }, 100);
    } catch (error) {
      console.error("Error al crear la publicación:", error);
      // Podrías querer ser más específico con el mensaje de error
      if (error instanceof Error) {
        alert(
          `Error al crear la publicación: ${error.message}. Por favor, intenta de nuevo.`
        );
      } else {
        alert(
          "Error desconocido al crear la publicación. Por favor, intenta de nuevo."
        );
      }
    } finally {
      setIsLoading(false);
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

  // --- RENDERIZADO CONDICIONAL ---
  if (isLoading) {
    return (
      <div className="container mx-auto px-8 py-8 flex justify-center items-center min-h-screen">
        <SimpleSpinner />
      </div>
    );
  }

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

      <div className="container mx-auto px-8 py-8 mt-8">
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
                    <Link
                      href="/TermsyCond"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600"
                    >
                      Términos y condiciones
                    </Link>
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
                  <PhoneInput
                    id="telefono"
                    name="telefono"
                    placeholder="Ingrese su teléfono"
                    value={formData.telefono}
                    onChange={(value) =>
                      setFormData({ ...formData, telefono: value || "" })
                    }
                    defaultCountry="AR" // Opcional: Elige el país que aparecerá por defecto (ej: "AR" para Argentina, "CO" para Colombia, "ES" para España)
                    className="w-full bg-white" // Puedes aplicar tus clases aquí para que se vea similar al resto
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
                  disabled={
                    categoriesData.localities[formData.ciudad]?.length === 0
                  } // Deshabilita si no hay localidades
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
