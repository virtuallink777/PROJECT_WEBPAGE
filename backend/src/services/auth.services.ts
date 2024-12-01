import VerificationCodeType from "../constans/verificationCodeTypes";
import UserModel from "../models/user.models";
import VerificationCodeModel from "../models/vertificationCode.model";
import { oneYearFromNow } from "../utils/date";

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
  if (existingUser) {
    throw new Error("User already exists");
  }

  // create user
  const user = await UserModel.create({
    email: data.email,
    password: data.password,
  });

  // create verification code
  const verificationCode = await VerificationCodeModel.create({
    userId: user._id,
    type: VerificationCodeType.EmailVerification,
    expiresAt: oneYearFromNow(),
    createdAt: new Date(),
  });

  // send verification email
  // create session
  // sign access token & refreshtoken
  // retunr user & tokens
};
