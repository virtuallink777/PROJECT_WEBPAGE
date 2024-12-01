import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const MONGODB_URL = getEnv("MONGODB_URL");
export const JWT_SECRET = getEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
export const GMAIL_SECRET = getEnv("GMAIL_SECRET");
export const NODE_ENV = getEnv("NODE_ENV");
export const PORT = getEnv("PORT", "4004");
export const APP_ORIGIN = getEnv("APP_ORIGIN");
