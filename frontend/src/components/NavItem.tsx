"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useCategoriesData } from "../categoriesData/categoriesdata";
import { useFilterStore } from "../lib/storeZsutandCities"; // Importamos Zustand

const Cities: React.FC = () => {
  const { selections, setSelection } = useFilterStore(); // Estado global de filtros
  const [openMenu, setOpenMenu] = useState<string | "">("");

  const categoriesData = useCategoriesData();

  const menuConfig = [
    { id: "Categorias", label: "Categorías" },
    { id: "Pais", label: "País" },
    { id: "Departamento", label: "Departamento" },
    { id: "ciudad", label: "Ciudad" },
    { id: "Localidad", label: "Localidad" },
  ] as const;

  const getAvailableOptions = (menuId: keyof typeof selections): string[] => {
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

  return (
    <div className="flex flex-wrap gap-5 p-10">
      {menuConfig.map(({ id, label }) => {
        const options = getAvailableOptions(id);
        const isDisabled =
          id !== "Categorias" &&
          id !== "Pais" &&
          !selections[
            menuConfig[menuConfig.findIndex((m) => m.id === id) - 1].id
          ];

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
                        onClick={() => {
                          setSelection(id as keyof typeof selections, option);
                          setOpenMenu("");
                        }}
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
      <div className="ml-auto flex items-center">
        <Link href="/ciudades" className={buttonVariants()}>
          Buscar
        </Link>
      </div>
    </div>
  );
};

export default Cities;
