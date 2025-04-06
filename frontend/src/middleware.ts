import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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
