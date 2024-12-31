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
}

// Definimos los nombres de las cookies exactamente como están en el backend
const ACCESS_TOKEN_COOKIE = "accessToken";

export async function getServerSideUser(
  cookieStore: ReturnType<typeof cookies>
): Promise<ServerSideUserResponse> {
  try {
    // Esperamos a que se resuelva la Promise de las cookies
    const cookiesList = await cookieStore;
    console.log("Lista de cookies disponibles:", cookiesList);

    // Intentamos obtener el accessToken
    const accessTokenCookie = cookiesList.get(ACCESS_TOKEN_COOKIE);

    if (!accessTokenCookie) {
      console.log("No se encontró el access token en las cookies");
      return { user: null };
    }

    const accessToken = accessTokenCookie.value;
    console.log("Access token obtenido:", accessToken);

    // decodificamos el accessToken
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET no está configurado");
    }

    const decoded = jwt.verify(accessToken, jwtSecret) as JWTPayload;

    // Construir el objeto usuario
    const user: User = {
      id: decoded.userId,
      email: decoded.email,
    };

    console.log(user.email);
    console.log("Usuario obtenido:", user);

    return { user };
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    return { user: null };
  }
}
