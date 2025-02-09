import { z } from "zod";
import catchErros from "../utils/catchErros";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmailCode,
} from "../services/auth.services";
import { CREATED, OK, UNAUTHORIZED } from "../constans/http";
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  setAuthCookies,
} from "../utils/cookies";
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.Schema";
import { AccessTokenPayload, verifyToken } from "../utils/jwt";
import SessionModel from "../models/session.model";
import appAssert from "../utils/appAssert";

export const registerHandler = catchErros(async (req, res) => {
  // validate request
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // call service
  const { user, accessToken, refreshToken } = await createAccount(request);

  // return response
  return setAuthCookies({ res, accessToken, refreshToken })
    .status(CREATED)
    .json(user);
});

export const loginHandler = catchErros(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });
  const { accessToken, refreshToken, email } = await loginUser(request);

  // Lista de emails de administradores
  const adminEmails = ["luiscantorhitchclief@gmail.com"];
  const isAdmin = adminEmails.includes(email);

  return setAuthCookies({ res, accessToken, refreshToken })
    .status(OK)
    .json({
      message: "Login successful",
      redirectTo: isAdmin ? "/admin" : "/dashboard",
      isAdmin,
    });
});

export const logoutHandler = catchErros(async (req, res) => {
  const accesToken = req.cookies.accessToken as string | undefined;
  const { payload } = verifyToken(accesToken || "");

  if (payload) {
    await SessionModel.findByIdAndDelete(payload.sessionId);
  }

  return clearAuthCookies(res)
    .status(OK)
    .json({ message: "Logout successful" });
});

export const refreshHandler = catchErros(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, "Refresh token not found");

  const { accessToken, newRefreshToken } = await refreshUserAccessToken(
    refreshToken
  );

  if (newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getAccessTokenCookieOptions());
  }

  return res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .json({ message: "Access token refreshed" });
});

export const verifyEmailHandler = catchErros(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmailCode(verificationCode);

  return res.status(OK).json({ message: "Email verified" });
});

export const sendPasswordResetEmailHandler = catchErros(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  await sendPasswordResetEmail(email);

  return res.status(OK).json({
    message:
      "Se ha enviado instrucciones a tu correo para el reestablecimiento de la contraseña",
  });
});

export const resetPasswordHandler = catchErros(async (req, res) => {
  const request = resetPasswordSchema.parse(req.body);

  await resetPassword(request);

  return clearAuthCookies(res)
    .status(OK)
    .json({ message: "Password reset successful" });
});
