import React from "react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import Link from "next/link";
import { Icons } from "./Icons";
import { buttonVariants } from "./ui/button";
import Cities from "./NavItem";
import UserAccountNav from "./UserAccountNav";
import { cookies } from "next/headers";
import { getServerSideUser } from "@/lib/serverSideUser";

export const Navbar = async () => {
  const nextCookies = cookies();
  const { user } = await getServerSideUser(nextCookies);
  console.log("Usuario desde Navbar:", user);
  return (
    <div className="bg-white sticky top-0 z-50 inset-x-0 h-16">
      <header className="relative bg-rose-300">
        <MaxWidthWrapper>
          <div className="border-b border-gray-500">
            <div className="flex h-16 items-center">
              {/* TODO: Mobile nav */}
              <div className="ml-4 flex lg:ml-0">
                <Link href="/">
                  <Icons.logo className="h-10 w-10" />
                </Link>
              </div>
              <div className="ml-50">{user ? null : <Cities />}</div>

              <div className="ml-auto flex items-center">
                <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
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

                  {user ? null : (
                    <div className="flex lg:ml-6">
                      <span
                        className="h-6 w-px bg-gray-500"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </MaxWidthWrapper>
      </header>
    </div>
  );
};
