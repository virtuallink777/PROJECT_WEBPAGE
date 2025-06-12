import mongoose from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

// Define los roles posibles para mayor consistencia y autocompletado
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  VALIDATOR = "validador", // O 'editor', 'moderator', como lo llames
}

export interface UserDocument extends mongoose.Document {
  __v: number;
  id: string;
  email: string;
  password: string;
  verify: boolean;
  role: UserRole; // <--- NUEVO CAMPO ROLE

  createdAt: Date;
  updatedAt: Date;
  comparePassword(val: string): Promise<boolean>;
  omitPassword(): Pick<
    UserDocument,
    "id" | "email" | "verify" | "createdAt" | "updatedAt" | "__v"
  >;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    verified: { type: Boolean, required: true, default: false },
    role: {
      // <--- DEFINICIÓN DEL NUEVO CAMPO ROLE
      type: String,
      enum: Object.values(UserRole), // Usa los valores del enum para validación
      default: UserRole.USER, // Por defecto, un nuevo usuario es 'user'
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await hashValue(this.password);
  next();
});

userSchema.methods.comparePassword = async function (val: string) {
  return compareValue(val, this.password);
};

userSchema.methods.omitPassword = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);
export default UserModel;
