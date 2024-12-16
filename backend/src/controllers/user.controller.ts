import { RequestHandler } from "express";
import { NOT_FOUND } from "../constans/http";
import UserModel from "../models/user.models";
import appAssert from "../utils/appAssert";
import catchErros from "../utils/catchErros";

export const getUserHandler = catchErros(async (req, res) => {
  const user = await UserModel.findById(req.userId);
  appAssert(user, NOT_FOUND, "User not found");
  return res.status(200).json(user.omitPassword());
});

export const getUserProfileHandler: RequestHandler = async (req, res) => {
  try {
    // Busca el usuario por ID (que viene del middleware de autenticación)
    const user = await UserModel.findById(req.userId);
    appAssert(user, NOT_FOUND, "User not found");
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error });
  }
};
