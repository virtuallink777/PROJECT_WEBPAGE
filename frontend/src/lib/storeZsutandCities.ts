import { create } from "zustand";

// Definimos el tipo para el estado de los filtros
interface FilterState {
  selections: {
    Categorias: string | null;
    Pais: string | null;
    Departamento: string | null;
    ciudad: string | null;
    Localidad: string | null;
  };
  setSelection: (
    filterType: keyof FilterState["selections"],
    value: string | null
  ) => void;
  clearSelections: () => void; // Opcional: Para limpiar las selecciones
}

// Creamos el store de Zustand
export const useFilterStore = create<FilterState>((set) => ({
  selections: {
    Categorias: null,
    Pais: null,
    Departamento: null,
    ciudad: null,
    Localidad: null,
  },
  setSelection: (filterType, value) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [filterType]: value,
        // Resetear los filtros dependientes si es necesario
        ...(filterType === "Pais" && {
          Departamento: null,
          ciudad: null,
          Localidad: null,
        }),
        ...(filterType === "Departamento" && {
          ciudad: null,
          Localidad: null,
        }),
        ...(filterType === "ciudad" && {
          Localidad: null,
        }),
      },
    })),
  clearSelections: () =>
    set({
      selections: {
        Categorias: null,
        Pais: null,
        Departamento: null,
        ciudad: null,
        Localidad: null,
      },
    }),
}));
