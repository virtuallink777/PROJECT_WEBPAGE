"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/storeZsutandCities"; // Asegúrate de importar bien

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    console.log(
      user ? `✅ Usuario logueado: ${user.email}` : "❌ No hay usuario"
    );
  }, [user]);

  return (
    <div>
      <h1>Dashboard</h1>
      {user ? <p>Bienvenido, {user.email}</p> : <p>No has iniciado sesión</p>}
    </div>
  );
};

export default Dashboard;
