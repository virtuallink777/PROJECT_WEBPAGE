import {
  LoginInput,
  loginSchema,
  RegisterInput,
  registerSchema,
} from "@/typeSchema/aut.schema";
import axios, { AxiosResponse } from "axios";
import { io } from "socket.io-client";
import { z } from "zod";

interface RegisterResponse {
  user: string;
  accessToken: string;
  refreshToken: string;
  redirectTo: string;
  isAdmin: string;
}

const socket = io("http://localhost:4004");

export const signUp = async (
  data: RegisterInput
): Promise<AxiosResponse<RegisterResponse>> => {
  try {
    // validar los datos con zod
    registerSchema.parse(data);

    // enviar los datos al backend
    const response = await axios.post(
      "http://localhost:4004/auth/register",
      data
    );

    console.log(response.data);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.message);
    }

    throw error;
  }
};

export const login = async (
  data: LoginInput
): Promise<AxiosResponse<RegisterResponse>> => {
  try {
    // validar los datos con zod

    loginSchema.parse(data);

    console.log(loginSchema.parse(data));

    if (data.verfied === false) {
      throw new Error(
        "El correo no ha sido verificado, por favor ve a tu correo y has click en el link de verificacion"
      );
    } else {
      // enviar los datos al backend
      const response = await axios.post(
        "http://localhost:4004/auth/login",
        data,
        {
          withCredentials: true, // Esta es la línea clave para manejar cookies
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data);
      return response;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // maneja los errores de validacion de zod
      throw error;
    }
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.post(
      "http://localhost:4004/auth/password/forgot",
      {
        email,
      },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          error.response.data.message || "Error al enviar solicitud"
        );
      }
      throw new Error("Error de conexión");
    }
    throw error;
  }
};

export const logout = async () => {
  console.log("🔴 Desconectando socket del admin...");
  socket.emit("admin-logout", {
    adminId: "67b6430f65f30b2dd8a65dc6",
    email: "luiscantorhitchclief@gmail.com",
  });
  socket.disconnect(); // 🔥 Fuerza la desconexión del socket
  console.log("✅ 'admin-logout' emitido correctamente desde el cliente.");
  localStorage.removeItem("isAdmin"); // Limpiar isAdmin en logout
  try {
    const response = await axios.get(
      "http://localhost:4004/auth/logout",

      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(response.data);

    return response;
  } catch (error) {
    console.error("Error durante el logout:", error);

    throw error;
  }
};
