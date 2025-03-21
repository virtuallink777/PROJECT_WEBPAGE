import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../constans/http";
import AppErrorCode from "../constans/appErrorCode";
import { verifyToken } from "../utils/jwt";
import mongoose from "mongoose";

const authenticate: RequestHandler = (req, res, next) => {
  console.log("Cookies in request:", req.cookies); // Aquí verificamos las cookies enviadas
  const accessToken = req.cookies.accessToken as string | undefined;

  if (!accessToken) {
    return res.status(UNAUTHORIZED).json({ message: "Not authorized" });
  }

  appAssert(
    accessToken,
    UNAUTHORIZED,
    "Not authorized",
    AppErrorCode.InvalidAccessToken
  );

  const { error, payload } = verifyToken(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired" ? "Session Expired" : "Invalid token",
    AppErrorCode.InvalidAccessToken
  );

  const { userId, sessionId, email } = payload as {
    userId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    email: string;
  };
  req.userId = userId.toString();
  req.sessionId = sessionId.toString();
  req.email = email;
  next();
};

export default authenticate;
