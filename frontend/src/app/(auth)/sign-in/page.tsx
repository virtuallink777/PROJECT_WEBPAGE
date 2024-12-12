"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword, login } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LoginInput } from "@/typeSchema/aut.schema";
import { Label } from "@radix-ui/react-label";
import { isAxiosError } from "axios";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JSX, useState } from "react";

const LoginPage = () => {
  const [errors, setErrors] = useState<Partial<LoginInput>>({});
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | JSX.Element>("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setServerError("");

    try {
      setIsLoading(true);
      const response = await login(formData);
      console.log("Usuario registrado:", response);

      if (response.status === 200) {
        router.push("/controlPanel");
        router.refresh();
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        switch (status) {
          case 401:
            setServerError(
              <p className="text-sm text-red-500 text-center">
                El correo{" "}
                <span className="text-blue-500 text-xl">{formData.email}</span>{" "}
                o la contraseña estan incorrectas, intentalo nuevamente
              </p>
            );
            break;

          case 403:
            setServerError(
              <p className="text-sm text-red-500 text-center">
                El correo{" "}
                <span className="text-blue-500 text-xl">{formData.email}</span>{" "}
                no ha sido verificado, por favor revise su correo para verificar
                su cuenta
              </p>
            );
            break;

          default:
            setServerError(
              <div className="text-sm text-red-500 text-center">
                Algo salió mal. Por favor intenta nuevamente.
              </div>
            );
        }
      } else {
        setServerError(
          <div className="text-sm text-red-500 text-center">
            Error de conexión. Por favor intenta nuevamente.
          </div>
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // logica para restear la contraseña

  const [email, setEmail] = useState("");
  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingReset(true);
    setMessage("");
    setError("");

    try {
      // Aquí llamamos a la función de API para solicitar restablecimiento
      const response = await forgotPassword(email);
      setMessage(response.data.message);

      setMessage("Se han enviado instrucciones a tu correo electrónico");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsLoadingReset(false);
    }
  };

  return (
    <>
      <div className="container relative flex pt-20 flex-col items-center justify-center lg:px-0">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col items-center space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Logueate</h1>

            <Link
              className={buttonVariants({
                variant: "link",
                className:
                  "text-sm text-zinc-700 dark:text-zinc-800 text-muted-foreground",
              })}
              href="/sign-up"
            >
              No tienes una cuenta? entonces create una
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {serverError && (
            <div className="text-red-500 text-sm text-center">
              {serverError}{" "}
            </div>
          )}

          <form onSubmit={handleLogin} className="grid gap-6">
            <div className="grid gap-2">
              <div className="grid gap-1 py-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-1 py-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Contraseña"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Logueate"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container relative flex pt-10 flex-col items-center justify-center lg:px-0">
        <div className="mx-auto flex w-full flex-col justify-center ietms-center space-y-6 sm:w-[350px]">
          <h1 className="font-semibold tracking-tight text-center">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-muted-foreground text-center pt-0 text-sm">
            Ingresa tu dirección de email y te enviaremos instrucciones para
            restablecer tu contraseña.
          </p>
          <div className="flex flex-col items-center space-y-2 w-full">
            <form
              className="flex flex-col items-center space-y-2 w-full"
              onSubmit={handleForgotPassword}
            >
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="p-2 border rounded-md w-full"
              />

              <Button
                type="submit"
                className="w-full p-2"
                disabled={isLoadingReset}
              >
                {isLoadingReset
                  ? "Enviando..."
                  : "Enviar indicaciones al email"}
              </Button>
            </form>
            {message && (
              <p className="text-sm text-green-500 text-center mt-2">
                {message}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 text-center mt-2">{error}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
