import { BAD_REQUEST, SERVER_ERROR } from "../constans/http";
import { z } from "zod";
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import AppError from "../utils/appErrors";

const handlerZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((err) => ({
    path: err.path.join("."),
    message: err.message,
  }));
  return res.status(BAD_REQUEST).json({
    message: error.message,
    errors,
  });
};

const handlerAppError = (res: Response, error: AppError) => {
  return res.status(error.statusCode).json({
    message: error.message,
    errorCode: error.errorCode,
  });
};

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(`PATH: ${req.path}`, error);

  if (error instanceof z.ZodError) {
    return handlerZodError(res, error);
  }

  if (error instanceof AppError) {
    return handlerAppError(res, error);
  }

  return res.status(SERVER_ERROR).send("Internal Server Error");
};

export default errorHandler;
