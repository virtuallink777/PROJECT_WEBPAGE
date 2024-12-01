import { Request, Response, NextFunction } from "express";

type asyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const catchErros = (controller: asyncController) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default catchErros;
