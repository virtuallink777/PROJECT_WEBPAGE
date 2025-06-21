"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { parse } from "path";
import { useEffect, useState } from "react";
import { set } from "zod";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [exp, setExp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const resetCode = searchParams.get("code");
    const expTime = searchParams.get("exp");

    if (resetCode && expTime) {
      setCode(resetCode);
      setExp(expTime);
    } else {
      setError("Código de restablecimiento inválido");
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Limpiar los mensajes anteriores

    // Validaciones básicas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Expresión regular: al menos una mayúscula y un número
    const regexMayusculaYNumero = /^(?=.*[A-Z])(?=.*\d).+$/;

    if (password.length < 8 || !regexMayusculaYNumero.test(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"
      );
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/password/reset`,
        {
          verificationCode: code,
          password,
          exp: parseInt(exp),
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response) {
        setSuccessMessage(
          "Tu contraseña fue restablecida con éxito. Por favor, inicia sesión con tu nueva contraseña."
        );
      }

      setTimeout(() => {
        router.push("/sign-in");
      }, 4000);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data.message || "No se pudo restablecer la contraseña"
        );
      } else {
        setError("Error de conexión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-4">
        <h2 className="text-2xl font-bold text-center">
          Restablecer Contraseña
        </h2>
        <p className="text-center">Ingresa Tu nueva Contraseña</p>
        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}
        {/* Mostrar error de manera no invasiva */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Label htmlFor="password">Nueva Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ingresa tu nueva contraseña"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirma tu nueva contraseña"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Reestableciendo..." : "Restablecer Contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
