import mongoose from "mongoose";

export interface FileHash {
  hash: string;
  fileName: string;
  filePath: string;
  createdAt: Date;
  fileType: "image" | "video";
}

export interface UserHash {
  userId: string;
  files: FileHash[];
}

export interface BackupHash {
  hash: string;
  fileName: string;
  filePath: string;
  createdAt: Date;
  fileType: "image" | "video";
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
  hashes: [fileHashSchema],
});

const backupHashSchema = new mongoose.Schema({
  hash: { type: String, required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  fileType: { type: String, enum: ["image", "video"], required: true },
});

export const UserHash = mongoose.model("UserHash", userHashSchema);
export const BackupHash = mongoose.model("BackupHash", backupHashSchema);
