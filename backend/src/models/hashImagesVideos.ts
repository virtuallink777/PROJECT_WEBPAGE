import mongoose from "mongoose";

export interface FileHash {
  hash: string;
  fileName: string;
  filePath: string;
  createdAt: Date;
  fileType: "image" | "video";
}

interface UserHash {
  userId: string;
  imageHashes: FileHash[];
  videoHashes: FileHash[];
}

const fileHashSchema = new mongoose.Schema<FileHash>({
  hash: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  fileType: { type: String, enum: ["image", "video"], required: true },
});

const userHashSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  imageHashes: [fileHashSchema], // Array para hashes de imágenes
  videoHashes: [fileHashSchema], // Array para hashes de videos
});

export const UserHash = mongoose.model("UserHash", userHashSchema);
