import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// definimos la interface del usuario
export interface User {
  id: string;
  email: string;
}

// interface para la respuesta  de la funcion
export interface ServerSideUserResponse {
  user: User | null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  exp?: number; // timestamp de expiración (opcional)
  iat?: number; // timestamp de creación (issued at) (opcional)
}

// Definimos los nombres de las cookies exactamente como están en el backend
const ACCESS_TOKEN_COOKIE = "accessToken";

export async function getServerSideUser(
  cookieStore: ReturnType<typeof cookies>
): Promise<ServerSideUserResponse> {
  try {
    const cookiesList = await cookieStore;
    const accessTokenCookie = cookiesList.get(ACCESS_TOKEN_COOKIE);

    if (!accessTokenCookie) {
      return { user: null }; // No hay token - usuario no logueado
    }

    const accessToken = accessTokenCookie.value;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET no está configurado");
    }

    try {
      const decoded = jwt.verify(accessToken, jwtSecret) as JWTPayload;

      const user: User = {
        id: decoded.userId,
        email: decoded.email,
      };

      return { user };
    } catch (verifyError) {
      // Manejo específico de errores de JWT
      if (verifyError instanceof jwt.TokenExpiredError) {
        console.log("Token expirado - redirigir a login");
        return { user: null }; // Token expirado - usuario no válido
      }

      if (verifyError instanceof jwt.JsonWebTokenError) {
        console.log("Token inválido");
        return { user: null }; // Token corrupto - usuario no válido
      }

      // Otros errores inesperados
      console.error("Error inesperado al verificar token:", verifyError);
      return { user: null };
    }
  } catch (error) {
    console.error("Error general:", error);
    return { user: null };
  }
}
