import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Middleware is running");
  console.log("Current path:", request.nextUrl.pathname);

  // Obtener la cookie de token de acceso
  const accessToken = request.cookies.get("accessToken")?.value;
  console.log("Access Token in Middleware:", accessToken);

  // Si no hay token, redirigir al login
  if (!accessToken) {
    console.log("No access token - Redirecting to login");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Aquí podrías agregar lógica adicional de validación del token si lo deseas
  return NextResponse.next();
}

export const config = {
  matcher: "/controlPanel/:path*",
};
