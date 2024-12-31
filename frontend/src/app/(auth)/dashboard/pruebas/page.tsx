"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

async function obtenerIdCliente() {
  try {
    const response = await fetch("/api/userId");
    const data = await response.json();
    return data.userId; // Esto te devolverá directamente el ID alfanumérico
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return null;
  }
}

// Uso:
const id = await obtenerIdCliente();
console.log(id); // Aquí tendrás el ID de 16 cifras

const Envio = () => {
  const [id, setId] = useState(null);
  const handleSubmit = async () => {
    const clienteId = await obtenerIdCliente();
    setId(clienteId);
  };

  return (
    <div>
      <Button onClick={handleSubmit}>Publicar</Button>
      <h1>{id}</h1>
    </div>
  );
};

export default Envio;
