import mongoose, { now } from "mongoose";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO__MANY_REQUESTS,
  UNAUTHORIZED,
} from "../constans/http";
import VerificationCodeType from "../constans/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.models";
import VerificationCodeModel from "../models/vertificationCode.model";
import appAssert from "../utils/appAssert";
import {
  fiveMinutesAgo,
  ONE_DAY_MS,
  oneHourFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";

import { APP_ORIGIN } from "../constans/env";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailsTemplates";
import { transport } from "../config/nodemailer";
import { hashValue } from "../utils/bcrypt";

export type createAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const createAccount = async (data: createAccountParams) => {
  // verify existing user doesnt exist
  const existingUser = await UserModel.exists({
    email: data.email,
  });

  appAssert(!existingUser, CONFLICT, "Email already exists");

  // create user
  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  const userId = user._id;

  // create verification code
  const verificationCode = await VerificationCodeModel.create({
    userId,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
    createdAt: new Date(),
  });

  console.log("Generated verification code:", verificationCode);

  // send verification email

  const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;

  const emailTemplate = getVerifyEmailTemplate(url);

  await transport.sendMail({
    from: "'WEBPAGE'  <negocios.caps@gmail.com>",
    to: user.email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
  });

  // create session
  const session = await SessionModel.create({
    userId,
    userAgent: data.userAgent,
  });

  // sign access token & refreshtoken
  const refreshtoken = signToken(
    { sessionId: session._id },
    refreshTokenSignOptions
  );

  const accesstoken = signToken({
    userId,
    sessionId: session._id,
    email: user.email,
  });

  // retunr user & tokens
  return {
    user: user.omitPassword(),
    accessToken: accesstoken,
    refreshToken: refreshtoken,
  };
};

export type loginParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const loginUser = async ({
  email,
  password,
  userAgent,
}: loginParams) => {
  // get user by email
  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Invalid credentials");

  // verify password from the request
  const isValidPassword = await user.comparePassword(password);
  appAssert(isValidPassword, UNAUTHORIZED, "Invalid credentials");

  // create session
  const userId = user._id;

  const session = await SessionModel.create({
    userId,
    userAgent,
  });

  const sessionInfo = {
    sessionId: session._id,
  };

  // sign access token & refreshtoken
  const refreshtoken = signToken(sessionInfo, refreshTokenSignOptions);

  const accesstoken = signToken({
    ...sessionInfo,
    userId,
    email: user.email,
  });

  // return user & tokens
  return {
    user: user.omitPassword(),
    accessToken: accesstoken,
    refreshToken: refreshtoken,
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

  const session = await SessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(
    session && session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    "Session Expired"
  );

  // refresh session if it expires in 24 hours

  const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  const newRefreshToken = sessionNeedsRefresh
    ? signToken({ sessionId: session._id }, refreshTokenSignOptions)
    : undefined;

  const accessToken = signToken({
    sessionId: session._id,
    userId: session.userId,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmailCode = async (code: string) => {
  // get verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: code,
    type: VerificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });

  appAssert(validCode, NOT_FOUND, "Invalid OR EXPIRED verification code");

  // update user to verified true

  const updateUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    {
      new: true,
    }
  );

  appAssert(updateUser, NOT_FOUND, "User not found");

  // delete verification cod
  await validCode.deleteOne();

  // return user
  return {
    user: updateUser.omitPassword(),
  };
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    console.log(`[Password Reset] Iniciando proceso para email: ${email}`);

    // get user by email
    const user = await UserModel.findOne({ email });
    appAssert(user, NOT_FOUND, "Usuario no encontrado");
    console.log(`[Password Reset] Usuario encontrado con ID: ${user._id}`);

    // check mail rate limit
    const fiveMinAgo = fiveMinutesAgo();
    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationCodeType.PasswordReset,
      createdAt: { $gt: fiveMinAgo },
    });

    console.log(`[Password Reset] Intentos en los últimos 5 minutos: ${count}`);
    appAssert(
      count <= 1,
      TOO__MANY_REQUESTS,
      "Demasiadas solicitudes, por favor intente más tarde"
    );

    // create verification code
    const expiresAt = oneHourFromNow();
    const verificationCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationCodeType.PasswordReset,
      expiresAt,
    });
    console.log(
      `[Password Reset] Código de verificación creado: ${verificationCode._id}`
    );

    // generate reset URL
    const url = `${APP_ORIGIN}/password/reset?code=${
      verificationCode._id
    }&exp=${expiresAt.getTime()}`;

    // get email template
    const emailTemplate = getPasswordResetTemplate(url);

    try {
      // send verification email
      await transport.sendMail({
        from: '"Tu Aplicación" <negocios.caps@gmail.com>',
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
      console.log(
        `[Password Reset] Email enviado exitosamente a: ${user.email}`
      );

      // Limpiar códigos antiguos
      const deleteResult = await VerificationCodeModel.deleteMany({
        userId: user._id,
        type: VerificationCodeType.PasswordReset,
        _id: { $ne: verificationCode._id },
      });
      console.log(
        `[Password Reset] Códigos antiguos eliminados: ${deleteResult.deletedCount}`
      );
    } catch (emailError) {
      console.error("[Password Reset] Error al enviar email:", emailError);

      // Eliminar el código de verificación si falla el envío
      await verificationCode.deleteOne();

      throw new Error(
        `Error al enviar el email de recuperación: ${
          (emailError as Error).message
        }`
      );
    }

    return {
      success: true,
      message: "Email de recuperación enviado exitosamente",
    };
  } catch (error) {
    console.error("[Password Reset] Error en el proceso:", error);

    // Manejar diferentes tipos de errores
    if (error instanceof Error) {
      if (error.message.includes("TOO_MANY_REQUESTS")) {
        throw new Error(
          "Has solicitado demasiados resets. Por favor espera 5 minutos."
        );
      }
      if (error.message.includes("Usuario no encontrado")) {
        // Por seguridad, no revelamos si el usuario existe o no
        return {
          success: true,
          message:
            "Si el email existe, recibirás un enlace para restablecer tu contraseña",
        };
      }
      if (error.message.includes("Error al enviar el email")) {
        throw new Error(
          "No se pudo enviar el email. Por favor intenta más tarde."
        );
      }
    }

    // Error genérico
    throw new Error("Ocurrió un error al procesar tu solicitud");
  }
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({
  password,
  verificationCode,
}: ResetPasswordParams) => {
  console.log("Received verification code:", verificationCode);

  // get verification code
  const validCode = await VerificationCodeModel.findOne({
    _id: new mongoose.Types.ObjectId(verificationCode),
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });
  console.log("Querying verification code with:", {
    _id: verificationCode,
    type: VerificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });

  console.log("Found verification code:", validCode);
  console.log("Current date:", new Date());

  appAssert(validCode, NOT_FOUND, "Invalid OR EXPIRED verification code");

  // update the user password
  const updateUser = await UserModel.findByIdAndUpdate(validCode.userId, {
    password: await hashValue(password),
  });

  appAssert(updateUser, INTERNAL_SERVER_ERROR, "User not found");

  // delete verification code
  await validCode.deleteOne();

  // delete all sesions
  await SessionModel.deleteMany({
    userId: updateUser._id,
  });

  return {
    user: updateUser.omitPassword(),
  };
};
