import mongoose from "mongoose";
import { string } from "zod";

declare global {
  namespace Express {
    interface Request {
      userId: mongoose.Types.ObjectId;
      sessionId: mongoose.Types.ObjectId;
      email: string;
    }
  }
}

export {};
