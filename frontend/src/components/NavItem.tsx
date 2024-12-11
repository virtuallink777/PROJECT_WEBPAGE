"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

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

interface CategoriesData {
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

interface MenuConfig {
  id: SelectionKeys;
  label: string;
}

const Cities: React.FC = () => {
  const [selections, setSelections] = useState<Selections>({
    Pais: "",
    Departamento: "",
    ciudad: "",
    Localidad: "",
    Categorias: "",
  });

  const [openMenu, setOpenMenu] = useState<SelectionKeys | "">("");

  const categoriesData: CategoriesData = useMemo(
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

  const menuConfig: MenuConfig[] = [
    { id: "Categorias", label: "Categorías" },
    { id: "Pais", label: "País" },
    { id: "Departamento", label: "Departamento" },
    { id: "ciudad", label: "Ciudad" },
    { id: "Localidad", label: "Localidad" },
  ];

  const getAvailableOptions = (menuId: SelectionKeys): string[] => {
    switch (menuId) {
      case "Categorias":
        return categoriesData.Categorias;
      case "Pais":
        return categoriesData.countries;
      case "Departamento":
        return selections.Pais
          ? categoriesData.departments[selections.Pais] || []
          : [];
      case "ciudad":
        return selections.Departamento
          ? categoriesData.cities[selections.Departamento] || []
          : [];
      case "Localidad":
        return selections.ciudad
          ? categoriesData.localities[selections.ciudad] || []
          : [];
      default:
        return [];
    }
  };

  const handleSelect = (menuId: SelectionKeys, value: string): void => {
    setSelections((prev) => {
      const newSelections = { ...prev, [menuId]: value };

      // Clear downstream selections
      const menuIndex = menuConfig.findIndex((m) => m.id === menuId);
      menuConfig.slice(menuIndex + 1).forEach((menu) => {
        newSelections[menu.id] = "";
      });

      return newSelections;
    });
    setOpenMenu("");
  };

  const isMenuDisabled = (menuId: SelectionKeys): boolean => {
    if (menuId === "Categorias" || menuId === "Pais") return false;

    const currentMenuIndex = menuConfig.findIndex((m) => m.id === menuId);
    if (currentMenuIndex <= 0) return false;

    const previousMenu = menuConfig[currentMenuIndex - 1];
    return !selections[previousMenu.id];
  };

  return (
    <>
      <div className="flex flex-wrap gap-5 p-10">
        {menuConfig.map(({ id, label }) => {
          const options = getAvailableOptions(id);
          const isDisabled = isMenuDisabled(id);

          return (
            <div key={id} className="relative">
              <div className="flex flex-col gap-1">
                <Button
                  onClick={() => setOpenMenu(openMenu === id ? "" : id)}
                  variant={openMenu === id ? "secondary" : "default"}
                  disabled={isDisabled}
                  className="h-8 px-2 text-sm min-w-[100px] justify-between"
                  size="sm"
                >
                  <span>{label}</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-all ${
                      openMenu === id ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {selections[id] && (
                  <div className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-center truncate max-w-[150px]">
                    {selections[id]}
                  </div>
                )}
              </div>

              {openMenu === id && options.length > 0 && (
                <div className="absolute z-50 w-[160px] bg-white rounded-md shadow-lg mt-1 border">
                  <div className="max-h-[250px] overflow-y-auto">
                    <div className="p-1 space-y-0.5">
                      {options.map((option) => (
                        <div
                          key={option}
                          className="px-2 py-1.5 text-xs hover:bg-gray-100 cursor-pointer rounded-sm transition-colors"
                          onClick={() => handleSelect(id, option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {/* Botón adicional al lado de "Localidad" */}
        <div className="ml-auto flex items-center">
          <Link href="/ciudades" className={buttonVariants()}>
            Buscar
          </Link>
        </div>
      </div>
    </>
  );
};
export default Cities;
