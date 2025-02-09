"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { RegisterInput } from "@/typeSchema/aut.schema";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JSX, useState } from "react";

const SignUp = () => {
  const [errors, setErrors] = useState<Partial<RegisterInput>>({});
  const [formData, setFormData] = useState<RegisterInput>({
    email: "",
    password: "",
    confirmPassword: "",
    userAgent: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | JSX.Element>("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    // Validaciones en el cliente
    const clientErrors: Partial<RegisterInput> = {};

    if (formData.password.length < 6) {
      clientErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (formData.password !== formData.confirmPassword) {
      clientErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return; // Salir de la función si hay errores en el cliente, no se envia el formulario
    }

    try {
      setIsLoading(true);
      const response = await signUp(formData);
      console.log("Usuario registrado:", response);

      router.push(`/verifyEmail?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setServerError(
          <p className="text-sm text-red-500 text-center">
            El correo {""}
            <span className="text-blue-500 text-xl">{formData.email}</span>
            ya esta registrado, por favor ingrese otro correo o logueate
          </p>
        );
      } else {
        setServerError(
          error instanceof Error ? error.message : "Error en el registro"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative flex pt-20 flex-col items-center justify-center lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col items-centerspace-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Crea tu cuenta
          </h1>
          <Link
            className={buttonVariants({
              variant: "link",
              className:
                "text-sm text-zinc-700 dark:text-zinc-800 text-muted-foreground",
            })}
            href="/sign-in"
          >
            Ya tienes una cuenta?, entonces logueate
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6">
          {serverError && (
            <div className="flex items-center justify-center">
              <p className="text-sm text-red-500">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                placeholder="Email"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className={cn(
                  "border border-gray-400 rounded-md",
                  errors.email && "border-red-500"
                )}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-1 mt-3">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                placeholder="Contraseña"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className={cn(
                  "border border-gray-400 rounded-md",
                  errors.password && "border-red-500"
                )}
                required
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="grid gap-1 mt-3">
              <Label htmlFor="password-confirm">Confirma tu Contraseña</Label>
              <Input
                placeholder="Contraseña"
                id="confirmPassword"
                className={cn(
                  "border border-gray-400 rounded-md",
                  errors.confirmPassword && "border-red-500"
                )}
                type="password"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Crea tu cuenta"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
