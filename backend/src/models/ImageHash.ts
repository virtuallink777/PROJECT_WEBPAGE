// models/ImageHash.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IImageHash extends Document {
  hash: string; // Hash único de la imagen
  createdAt: Date; // Fecha de creación
}

const ImageHashSchema = new Schema<IImageHash>({
  hash: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const ImageHash = mongoose.model<IImageHash>(
  "ImageHash",
  ImageHashSchema
);
