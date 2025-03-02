import { create } from "zustand";

type SelectionKeys =
  | "Pais"
  | "Departamento"
  | "ciudad"
  | "Localidad"
  | "Categorias";

interface Selections {
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  Categorias: string;
}

interface FilterStore {
  selections: Selections;
  setSelection: (key: SelectionKeys, value: string) => void;
  resetSelections: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  selections: {
    Pais: "",
    Departamento: "",
    ciudad: "",
    Localidad: "",
    Categorias: "",
  },

  setSelection: (key, value) =>
    set((state) => {
      const newSelections = { ...state.selections, [key]: value };

      // Limpiar selecciones dependientes
      if (key === "Pais") {
        newSelections.Departamento = "";
        newSelections.ciudad = "";
        newSelections.Localidad = "";
      } else if (key === "Departamento") {
        newSelections.ciudad = "";
        newSelections.Localidad = "";
      } else if (key === "ciudad") {
        newSelections.Localidad = "";
      }

      return { selections: newSelections };
    }),

  resetSelections: () =>
    set({
      selections: {
        Pais: "",
        Departamento: "",
        ciudad: "",
        Localidad: "",
        Categorias: "",
      },
    }),
}));
