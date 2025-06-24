import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { SessionDocument } from "../models/session.model";
import { UserDocument } from "../models/user.models";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constans/env";

export type RefreshTokenPayload = {
  sessionId: SessionDocument["_id"];
};

export type AccessTokenPayload = {
  userId: UserDocument["_id"];
  sessionId: SessionDocument["_id"];
  email: UserDocument["email"];
};

type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

//const defaults: SignOptions = {
//audience: ["user"] as [string, ...string[]], // 👈 aquí está el fix
//};

const signDefaults: SignOptions = {
  audience: ["user"] as [string, ...string[]],
};

const verifyDefaults: VerifyOptions = {
  audience: ["user"] as [string | RegExp, ...(string | RegExp)[]],
};

export const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "1h",
  secret: JWT_SECRET,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "30d",
  secret: JWT_REFRESH_SECRET,
};

export const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  options?: SignOptionsAndSecret
) => {
  const { secret, ...signOptions } = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, {
    ...signDefaults,
    ...signOptions,
  });
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & { secret: string }
) => {
  const { secret = JWT_SECRET, ...verifyOptions } = options || {};
  try {
    const decoded = jwt.verify(token, secret, {
      ...verifyDefaults,
      ...verifyOptions,
    });

    if (!decoded || typeof decoded === "string") {
      return {
        error: "Invalid token payload",
      };
    }

    const payload = decoded as TPayload;
    return { payload };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};
