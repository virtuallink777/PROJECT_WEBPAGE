import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const ControlPanel = () => {
  return (
    <div className="container relative flex pt-10 flex-col items-center justify-center lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Panel de Control</h1>
        </div>
        <div className="flex flex-col items-center space-y-4 mt-4">
          <Link href="/dashboard/createPublications" className="w-full text-lg">
            <Button className="w-full text-lg">Crear Publicaciones</Button>
          </Link>
          <Link href="/dashboard/viewPublications" className="w-full text-lg">
            <Button className="w-full text-lg">Tus Publicaciones</Button>
          </Link>

          <Button className="w-full text-lg">Pagar Publicaciones</Button>
          <Button className="w-full text-lg">Estadísticas</Button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
