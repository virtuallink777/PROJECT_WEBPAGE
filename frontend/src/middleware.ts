import { NextResponse } from "next/server";

export function middleware(request) {
  const jwt = request.cookies.get("accessToken");
  if (
    request.nextUrl.pathname.includes("/dashboard") ||
    request.nextUrl.pathname.includes("/admin")
  ) {
    if (jwt === undefined) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
  }
}
