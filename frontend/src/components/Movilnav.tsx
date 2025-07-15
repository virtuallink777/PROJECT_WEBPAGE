"use client";

import { useState, useEffect } from "react"; // Importamos useEffect
import Link from "next/link";
import { buttonVariants } from "./ui/button";

import UserAccountNav from "./UserAccountNav";

// La interfaz User no cambia
interface User {
  id: string;
  email: string;
  userId?: string;
}

// La interfaz MobileNavProps no cambia
interface MobileNavProps {
  user: User | null;
}

export const MobileNav: React.FC<MobileNavProps> = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Efecto para controlar el scroll del body cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"; // Evita el scroll del fondo
    } else {
      document.body.style.overflow = "auto"; // Restaura el scroll
    }

    // Función de limpieza para restaurar el scroll si el componente se desmonta
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]); // Se ejecuta cada vez que 'isMenuOpen' cambia

  return (
    <div className="lg:hidden">
      {/* Botón de hamburguesa (sin cambios) */}
      <button onClick={toggleMenu} className="text-gray-700 focus:outline-none">
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16m-7 6h7"
          ></path>
        </svg>
      </button>

      {/* Menú desplegable - CON LAS CORRECCIONES */}
      {isMenuOpen && (
        // 👇 AÑADIMOS z-50 para que esté por encima de todo
        // 👇 AÑADIMOS w-full para que ocupe todo el ancho
        // 👇 AÑADIMOS h-screen para que ocupe toda la altura y tenga un fondo sólido
        <div className="absolute top-0 left-0 w-full h-screen bg-white z-50">
          <div className="px-4 py-2">
            {/* Opcional: Añadir un botón de cerrar dentro del menú */}
            <div className="flex justify-end mb-4">
              <button onClick={toggleMenu} className="text-2xl font-bold">
                ×
              </button>
            </div>

            {/* AHORA, en lugar de renderizar Cities, puedes renderizar el menú */}
            {user ? (
              <UserAccountNav user={user} />
            ) : (
              <div className="flex flex-col space-y-4 bg-rose-100">
                <Link
                  href="/sign-in"
                  onClick={toggleMenu}
                  className={`${buttonVariants()} block w-full text-center my-2`}
                >
                  Logueate
                </Link>
                <Link
                  href="/sign-up"
                  onClick={toggleMenu}
                  className={`${buttonVariants()} block w-full text-center my-2`}
                >
                  Crea una Cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
