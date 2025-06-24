import { CookieOptions, Response } from "express";

const secure = process.env.NODE_ENV !== "development";

console.log("NODE_ENV:", process.env.NODE_ENV);

const defaults: CookieOptions = {
  sameSite: "lax",
  httpOnly: true,
  secure,
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
  return res
    .clearCookie("accessToken", {
      httpOnly: true,
      secure,
      sameSite: "lax",
    })
    .clearCookie("refreshToken", {
      path: "/auth/refresh",
      httpOnly: true,
      secure,
      sameSite: "lax",
    });
};
