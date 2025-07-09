import React from "react";
import countries from "country-telephone-data";
import Image from "next/image";

const PhoneNumberWithFlag = ({ pais, telefono }) => {
  // Validar que pais y telefono estén definidos
  if (!pais || !telefono) {
    return <span>{telefono || "N/A"}</span>; // Muestra el teléfono o un valor por defecto
  }
  console.log("telefono", telefono);
  console.log("pais", pais);

  // Normalizar el nombre del país
  const normalizedPais = pais
    .toLowerCase() // Convertir a minúsculas
    .normalize("NFD") // Normalizar caracteres (quitar tildes)
    .replace(/[\u0300-\u036f]/g, ""); // Eliminar tildes y diacríticos
  // Buscar el país en la lista de países
  const countryData = countries.allCountries.find(
    (country) => country.name.toLowerCase() === normalizedPais
  );

  // Si no se encuentra el país, mostrar solo el teléfono
  if (!countryData) {
    return <span>{telefono}</span>;
  }
  // Extraer el prefijo y la bandera
  const prefix = countryData.dialCode; // Prefijo telefónico
  const flag = countryData.iso2.toLowerCase(); // Código ISO para la bandera

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {/* Mostrar la bandera */}
      <Image
        src={`https://flagcdn.com/${flag}.svg`} // Usar FlagCDN para las banderas
        alt={`Bandera de ${pais}`}
        style={{ width: "20px", marginRight: "8px" }}
      />
      {/* Mostrar el teléfono con el prefijo */}
      <span>
        +{prefix} {telefono}
      </span>
    </div>
  );
};

export default PhoneNumberWithFlag;
