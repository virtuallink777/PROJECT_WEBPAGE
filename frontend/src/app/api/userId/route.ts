import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface JwtPayloadCustom {
  userId: string;
  email: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("accessToken");

    if (!userCookie) {
      return NextResponse.json(
        { message: "No estás autenticado" },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        "JWT_SECRET no está configurado en las variables de entorno"
      );
    }

    const decode = jwt.verify(userCookie.value, secret) as JwtPayloadCustom;

    console.log("Decoded token:", decode);

    return NextResponse.json({ userId: decode.userId });
  } catch (error) {
    console.error("Error al obtener el ID del usuario:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
