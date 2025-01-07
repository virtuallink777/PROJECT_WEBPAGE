"use client";

import { logout } from "@/lib/auth";
import { User } from "@/lib/serverSideUser";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import Link from "next/link";

const UserAccountNav = ({ user }: { user: User }) => {
  const router = useRouter();

  const handleLogOut = async () => {
    try {
      await logout();

      router.push("/");
      router.refresh();
    } catch (error) {
      // Manejo de errores si es necesario
      console.error("Error en logout", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="overflow-visible">
        <Button variant="ghost" size="sm" className="relative text-base">
          {"Mi cuenta: " + user.email}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="bg-white w-60" align="end">
        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col space-y-0.5 leading-none text-center">
            <p className="font-medium text-sm  text-gray-500">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          Ir a mi panel de control
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer" onClick={handleLogOut}>
          Deslogueate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;
