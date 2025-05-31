// En hashImagesVideos.ts (o como se llame tu archivo de modelo)

import mongoose from "mongoose";

// Interfaz para los detalles del archivo guardado
export interface StoredFileDetails {
  hash: string;
  fileName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  createdAt: Date;
  fileType: "image" | "video";
}

// Interfaz para el documento principal del usuario
interface UserStoredFiles {
  userId: string; // <--- CAMBIADO A string PARA COINCIDIR CON EL ESQUEMA
  imageFiles: StoredFileDetails[];
  videoFiles: StoredFileDetails[];
}

const storedFileDetailsSchema = new mongoose.Schema<StoredFileDetails>({
  hash: { type: String, required: true, index: true },
  fileName: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  fileType: { type: String, enum: ["image", "video"], required: true },
});

const userStoredFilesSchema = new mongoose.Schema<UserStoredFiles>({
  userId: { type: String, required: true, unique: true, index: true }, // userId es un String
  imageFiles: [storedFileDetailsSchema],
  videoFiles: [storedFileDetailsSchema],
});

// Mantienes el nombre de exportación UserHash, lo cual está bien.
export const UserHash = mongoose.model<UserStoredFiles>( // La interfaz genérica es UserStoredFiles
  "UserHash", // Nombre de la colección/modelo
  userStoredFilesSchema
);
