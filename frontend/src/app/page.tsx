import Link from "next/link";
import MaxWidthWrapper from "../components/MaxWidthWrapper";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <MaxWidthWrapper>
      <div className="py-20 mx-auto text-center flex flex-col items-center max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight">
          Bienvenidos a la Pagina de Inicio
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link href="/models" className={buttonVariants()}>
            {" Busqueda"}
          </Link>
        </div>
      </div>
      {/* TODO: ALL PRODUCTS */}
    </MaxWidthWrapper>
  );
}
