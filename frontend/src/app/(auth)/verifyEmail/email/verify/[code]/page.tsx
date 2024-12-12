"use client";

import { buttonVariants } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function VerifyEmailPage() {
  const { code } = useParams(); // Obtenemos el parámetro dinámico "code"

  useEffect(() => {
    if (code) {
      // Llama al backend para verificar el código
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/email/verify/${code}`)
        .then((res) => {
          if (res.ok) {
            console.log("Correo electrónico verificado con éxito.");
          } else {
            console.error("Error al verificar el correo electrónico.");
          }
        })
        .catch((err) => console.error(err));
    }
  }, [code]);

  if (!code) {
    return (
      <div className="flex flex-col items-center gap-2">
        <XCircle className="h-8 w-8 text-red-600" />
        <h3 className="font-semibold text-xl">Hubo un problema</h3>
        <p className="text-muted-foreground text-sm">
          El enlace a expirado por favor intenetelo nuevamente
        </p>
      </div>
    );
  }

  if (code) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative mb-4 h-60 w-60 text-muted-foreground"></div>

        <h3 className="font-semibold text-2xl">Email verificado con exito</h3>
        <p className="text-muted-foreground text-center mt-1">
          Gracias por verificar tu email
        </p>
        <Link className={buttonVariants({ className: "mt-4" })} href="/sign-in">
          Logueate
        </Link>
      </div>
    );
  }
}
