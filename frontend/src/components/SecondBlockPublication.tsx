import { useCategoriesData } from "../categoriesData/categoriesdata";

interface FormData {
  Categorias: string;
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  direccion: string;
  mostrarEnMaps: boolean;
}

interface SecondBlockPublicationProps {
  formData: FormData;

  onFormChange: (name: keyof FormData, value: string | boolean) => void;
}

export const SecondBlockPublication: React.FC<SecondBlockPublicationProps> = ({
  formData, // Viene del padre

  onFormChange,
}) => {
  const categoriesData = useCategoriesData();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      onFormChange(name as keyof FormData, checkbox.checked);
    } else {
      let updatedFormData = { ...formData, [name]: value };

      if (name === "Pais") {
        updatedFormData = {
          ...updatedFormData,
          Departamento: "",
          ciudad: "",
          Localidad: "",
        };
      } else if (name === "Departamento") {
        updatedFormData = {
          ...updatedFormData,
          ciudad: "",
          Localidad: "",
        };
      } else if (name === "ciudad") {
        updatedFormData = {
          ...updatedFormData,
          Localidad: "",
        };
      }

      onFormChange(name as keyof FormData, value);
      onFormChange(
        "Departamento" as keyof FormData,
        updatedFormData.Departamento
      );
      onFormChange("ciudad" as keyof FormData, updatedFormData.ciudad);
      onFormChange("Localidad" as keyof FormData, updatedFormData.Localidad);
    }
  };

  // Estilos comunes
  const fieldContainerStyle =
    "flex flex-col space-y-2 max-w-2xl max-w-md mx-auto";
  const labelStyle = "text-gray-700 font-semibold mb-2 mt-2";
  const inputStyle = "w-full border border-gray-300 rounded p-2 bg-white";
  const selectStyle = "w-full border border-gray-300 rounded p-2 bg-white";

  const checkboxContainerStyle = "flex items-center space-x-2";
  return (
    <>
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
          onChange={handleInputChange} // Agregado
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
          onChange={handleInputChange} // Agregado
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
            onChange={handleInputChange} // Agregado
            required
          >
            <option value="">Selecciona un departamento</option>
            {categoriesData.departments[formData.Pais]?.map((departamento) => (
              <option key={departamento} value={departamento}>
                {departamento.replace(/_/g, " ")}
              </option>
            ))}
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
            onChange={handleInputChange} // Agregado
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
            onChange={handleInputChange} // Agregado
          >
            <option value="">Selecciona una localidad</option>
            {categoriesData.localities[formData.ciudad]?.map((localidad) => (
              <option key={localidad} value={localidad}>
                {localidad.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Campo Dirección */}
      <div className={fieldContainerStyle}>
        <label htmlFor="direccion" className={labelStyle}>
          Dirección (opcional):
        </label>
        <input
          id="direccion"
          name="direccion"
          className={inputStyle}
          type="text"
          placeholder="Ingresa tu dirección, o un lugar conocido de referencia"
          value={formData.direccion}
          onChange={handleInputChange} // Agregado
        />
      </div>

      {/* Checkbox Google Maps */}
      <div className={checkboxContainerStyle}>
        <input
          type="checkbox"
          id="mostrarEnMaps"
          name="mostrarEnMaps"
          checked={formData.mostrarEnMaps}
          className="h-4 w-4 text-blue-600"
          onChange={handleInputChange} // Agregado
        />
        <label htmlFor="mostrarEnMaps" className={labelStyle}>
          Mostrar dirección en Google Maps
        </label>
      </div>

      <div className="border-b border-gray-500 mt-2 mb-2" />
    </>
  );
};
