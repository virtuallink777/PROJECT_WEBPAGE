"use client"; // Esto es necesario para usar hooks en Next.js

import { useState } from "react";
import Link from "next/link";

import { buttonVariants } from "./ui/button";
import Cities from "./NavItem";
import UserAccountNav from "./UserAccountNav";

interface User {
  id: string;
  email: string;
  userId?: string; // El nombre puede ser opcional
}

interface MobileNavProps {
  user: User | null; // El usuario puede ser nulo si no está autenticado
}

export const MobileNav: React.FC<MobileNavProps> = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="lg:hidden">
      {/* Botón de hamburguesa */}
      <button onClick={toggleMenu} className="text-gray-700 focus:outline-none">
        <svg
          className="w-6 h-6"
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

      {/* Menú desplegable */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-t border-gray-200">
          <div className="px-4 py-2">
            {user ? null : <Cities />}
            {user ? null : (
              <Link
                href="/sign-in"
                className={`${buttonVariants()} block w-full text-center my-2`}
              >
                Logueate
              </Link>
            )}
            {user ? null : (
              <Link
                href="/sign-up"
                className={`${buttonVariants()} block w-full text-center my-2`}
              >
                Crea una Cuenta
              </Link>
            )}
            {user ? <UserAccountNav user={user} /> : null}
          </div>
        </div>
      )}
    </div>
  );
};
