import { CookieOptions, Response } from "express";

// Determina si estamos en producción (en Render) o desarrollo (local)
const isProduction = process.env.NODE_ENV === "production";

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Cookies will be set with secure =", isProduction);

const defaults: CookieOptions = {
  sameSite: isProduction ? "none" : "lax",
  httpOnly: true,
  secure: isProduction, // Usa secure=true solo en producción
  domain: isProduction ? ".prepagoslujuria.com" : undefined,
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  path: "/auth/refresh",
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) => {
  return res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());
};

export const clearAuthCookies = (res: Response) => {
  // Al limpiar, usa las mismas opciones con las que se creó la cookie
  return res
    .clearCookie("accessToken", getAccessTokenCookieOptions())
    .clearCookie("refreshToken", getRefreshTokenCookieOptions());
};
