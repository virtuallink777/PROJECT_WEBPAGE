import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GOOGLE_MAPS_API_KEY = "AIzaSyB-tJH-ygdEjUAm0Lj8lsA6BR2PXNt_jk4";
