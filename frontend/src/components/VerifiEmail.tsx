"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const VerifyEmailPageTsx = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();

  useEffect(() => {
    // Redirige a la página principal después de 10 segundos
    const timer = setTimeout(() => {
      router.push("/");
    }, 10000);

    return () => clearTimeout(timer); // limpia el temporizador
  }, [router]);

  return (
    <div className="container relative flex pt-20 flex-col items-center justify-center lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <p className="text-muted-foreground text-center text-2xl">
          Hemos enviado un correo con un link a tu correo:{" "}
          <b className="font-semibold">{email}</b>
        </p>
        <p className="text-muted-foreground text-center">
          Redirigiendo automáticamente a la página principal en 10 segundos...
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPageTsx;
