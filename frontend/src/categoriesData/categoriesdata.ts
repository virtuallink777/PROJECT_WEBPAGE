import { useMemo } from "react";

export interface CategoriesData {
  Categorias: string[];
  countries: string[];
  departments: {
    [key: string]: string[];
  };
  cities: {
    [key: string]: string[];
  };
  localities: {
    [key: string]: string[];
  };
}

export function useCategoriesData(): CategoriesData {
  return useMemo(
    () => ({
      Categorias: ["S", "M", "W", "T", "L", "G", "P"],
      countries: ["COLOMBIA", "PERU"],
      departments: {
        COLOMBIA: [
          "AMAZONAS",
          "ANTIOQUIA",
          "ARAUCA",
          "ATLANTICO",
          "BOGOTA",
          "BOLIVAR",
          "BOYACA",
          "CALDAS",
          "CAQUETA",
          "CASANARE",
          "CAUCA",
          "CESAR",
          "CHOCO",
          "CORDOBA",
          "CUNDINAMARCA",
          "GUANIA",
          "GUAVIARE",
          "HUILA",
          "GUAJIRA",
          "MAGDALENA",
          "META",
          "NARIÑO",
          "NORTE_DE_SANTANDER",
          "PUTUMAYO",
          "QUINDIO",
          "RISARALDA",
          "SAN_ANDRES",
          "SANTANDER",
          "SUCRE",
          "TOLIMA",
          "VALLE",
          "VAUPES",
          "VICHADA",
        ],
        PERU: ["LIMA"],
      },
      cities: {
        AMAZONAS: ["LETICIA", "PUERTO_SANTANDER"],
        ANTIOQUIA: ["MEDELLIN"],
        BOGOTA: ["BOGOTA"],
        LIMA: ["LIMA_CIUDAD"],
      },
      localities: {
        BOGOTA: [
          "Antonio_Nariño",
          "Barrios_Unidos",
          "Bosa",
          "Chapinero",
          "Ciudad_Bolivar",
          "Engativá",
          "Fontibón",
          "Kennedy",
          "La_Candelaria",
          "Puente_Aranda",
          "Teusaquillo",
        ],
        LETICIA: ["Centro", "Sur", "Norte"],
        PUERTO_SANTANDER: ["Zona 1", "Zona 2"],
        MEDELLIN: [
          "Doce_De_Octubre",
          "Castilla",
          "Santacruz",
          "Popular",
          "Robledo",
        ],
        LIMA_CIUDAD: ["Miraflores", "San Isidro"],
      },
    }),
    []
  );
}
