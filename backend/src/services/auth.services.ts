import { now } from "mongoose";
import { CONFLICT, NOT_FOUND, UNAUTHORIZED } from "../constans/http";
import VerificationCodeType from "../constans/verificationCodeTypes";
import SessionModel from "../models/session.model";
import UserModel from "../models/user.models";
import VerificationCodeModel from "../models/vertificationCode.model";
import appAssert from "../utils/appAssert";
import { ONE_DAY_MS, oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../utils/jwt";
import { sendVerificationEmail } from "../utils/sendVerificationEmail";

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

  // send verification email
  await sendVerificationEmail(user, verificationCode);

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

export const verifyEmail = async (code: string) => {
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
