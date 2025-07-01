import Link from "next/link";

import { buttonVariants } from "./ui/button";
import Cities from "./NavItem";
import UserAccountNav from "./UserAccountNav";
import { cookies } from "next/headers";
import { getServerSideUser } from "@/lib/serverSideUser";
import { MobileNav } from "./Movilnav";
import Image from "next/image";

export const Navbar = async () => {
  const nextCookies = cookies();
  const { user } = await getServerSideUser(nextCookies);

  return (
    <div className="bg-rose-300 sticky top-0 z-50 w-full border-b border-gray-500 py-2">
      <div className="flex h-24 items-center      mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Menú de móviles (solo visible en móviles) */}
        <div className="flex lg:hidden">
          <MobileNav user={user} />
        </div>

        {/* Logo (visible en todas las pantallas) */}
        <div className="flex items-center justify-start  w-fit h-fit">
          <Link href="/" className="inline-block w-fit h-fit">
            <Image
              src="/3d3.png" // Asegúrate de usar la ruta real
              alt="Logo"
              width={100} // estaba en 300 con labios..modificar nuevamente
              height={100} // estaba en 300 con labios..modificar nuevamente
            />
          </Link>
        </div>

        {/* Cities y elementos del lado derecho (solo visibles en pantallas grandes) */}
        <div className="hidden lg:flex lg:items-center lg:space-x-6">
          {user ? null : <Cities />}
        </div>

        <div className="flex items-center justify-end flex-1">
          {/* Elementos para pantallas grandes (ocultos en móviles) */}
          <div className="hidden lg:flex lg:items-center lg:space-x-3">
            {user ? null : (
              <Link href="/sign-in" className={buttonVariants()}>
                Logueate
              </Link>
            )}
            {user ? null : (
              <span className="h-6 w-px bg-gray-500" aria-hidden="true" />
            )}
            {user ? (
              <UserAccountNav user={user} />
            ) : (
              <Link href="/sign-up" className={buttonVariants()}>
                Crea una Cuenta
              </Link>
            )}

            {user ? (
              <span className="h-6 w-px bg-gray-500" aria-hidden="true" />
            ) : null}
            <span className="h-6 w-px bg-gray-500" aria-hidden="true" />
            <div className="flex ml-2">
              <Link href="/contact" className={buttonVariants()}>
                Contactanos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
