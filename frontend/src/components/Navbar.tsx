import Link from "next/link";

import { buttonVariants } from "./ui/button";

import UserAccountNav from "./UserAccountNav";
import { cookies } from "next/headers";
import { getServerSideUser } from "@/lib/serverSideUser";
import { MobileNav } from "./Movilnav";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: "700" });

export const Navbar = async () => {
  const nextCookies = cookies();
  const { user } = await getServerSideUser(nextCookies);

  return (
    <div className="bg-rose-300 sticky top-0 z-50 w-full border-b border-gray-500 py-2">
      {/* Contenedor Principal: Un solo nivel, con justify-between */}
      <div className="relative flex items-center justify-between h-12 lg:h-18 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- BLOQUE IZQUIERDO: Todo lo que va a la izquierda --- */}
        <div className="flex items-center">
          {/* Menú de hamburguesa (móviles) */}
          <div className="lg:hidden">
            <MobileNav user={user} />
          </div>

          {/* Logo y Marca */}
          <Link href="/" className="flex items-center gap-2 ml-4 lg:ml-0">
            {" "}
            {/* Añadimos margen izquierdo en móvil */}
            {/* Contenedor del Logo con tamaños responsivos */}
            <div className="relative w-24 h-24 lg:w-36 lg:h-36 flex-shrink-0">
              <Image
                src="/3d3.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            {/* Marca */}
            <span
              className={`${playfair.className} text-2xl lg:text-4xl text-red-800`}
            >
              LUJURIA
            </span>
          </Link>
        </div>

        {/* --- BLOQUE DERECHO: Navegación de Escritorio --- */}
        {/* Oculto en móviles, visible en pantallas grandes */}
        <div className="hidden lg:flex items-center space-x-6">
          {/* Aquí va tu navegación: Login, Signup, Contacto */}
          {user ? (
            <UserAccountNav user={user} />
          ) : (
            <div className="flex items-center space-x-3">
              <Link href="/sign-in" className={buttonVariants()}>
                Logueate
              </Link>
              <Link href="/sign-up" className={buttonVariants()}>
                Crea una Cuenta
              </Link>
            </div>
          )}
          <div className="h-6 w-px bg-gray-500" aria-hidden="true" />
          <Link href="/contact" className={buttonVariants()}>
            Contactanos
          </Link>
        </div>
      </div>
    </div>
  );
};
