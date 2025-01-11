import { Input } from "./ui/input";

interface FormData {
  titulo: string;
  descripcion: string;
  adicionales: string;
}

interface FirstBlockPublicationProps {
  formData: FormData;
  errors: Record<keyof FormData, string>;
  onFormChange: (name: keyof FormData, value: string | boolean) => void;
}

export const ThirdBlockPublications: React.FC<FirstBlockPublicationProps> = ({
  formData,
  errors,
  onFormChange,
}) => {
  // Estilos comunes

  const labelStyle = "text-gray-700 font-semibold";
  const inputStyle = "w-full border border-gray-300 rounded p-2 bg-white";

  const textareaStyle =
    "w-full border border-gray-300 rounded p-2 min-h-[200px] resize-y";

  return (
    <>
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
          onChange={(e) => onFormChange("titulo", e.target.value)}
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
          onChange={(e) => onFormChange("descripcion", e.target.value)}
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
          onChange={(e) => onFormChange("adicionales", e.target.value)}
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
    </>
  );
};
