import { create } from "zustand";
import { persist } from "zustand/middleware";

// Definimos el tipo para el estado de los filtros
interface FilterState {
  selections: {
    Categorias: string | null;
    Pais: string | null;
    Departamento: string | null;
    ciudad: string | null;
    Localidad: string | null;
  };
  searchText: string; // Nuevo estado para el campo de búsqueda
  setSelection: (
    filterType: keyof FilterState["selections"],
    value: string | null
  ) => void;
  setSearchText: (text: string) => void; // Función para actualizar el texto de búsqueda
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
  searchText: "", // Valor inicial del campo de búsqueda
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
  setSearchText: (text) => set({ searchText: text }), // Actualizar el texto de búsqueda
  clearSelections: () =>
    set({
      selections: {
        Categorias: null,
        Pais: null,
        Departamento: null,
        ciudad: null,
        Localidad: null,
      },
      searchText: "", // Limpiar también el campo de búsqueda
    }),
}));
