import mongoose from "mongoose";
import { Document } from "mongoose";

export interface IPublication extends Document {
  userId: mongoose.Schema.Types.ObjectId; // relacion con el usuario
  email: string;
  esMayorDeEdad: boolean;
  nombre: string;
  edad: number;
  telefono: string;
  Categorias: string;
  Pais: string;
  Departamento: string;
  ciudad: string;
  Localidad: string;
  direccion: string;
  mostrarEnMaps: boolean;
  titulo: string;
  descripcion: string;
  adicionales: string;
  estado?: string;
  razon?: string;
  images: Array<{
    url: string;
    isPrincipal: boolean;
    filename: string;
    originalFilename: String; // <--- AÑADIR ESTE CAMPO
  }>;
  videos: Array<{
    url: string;
    filename: string;
    originalFilename: String; // <--- AÑADIR ESTE CAMPO
  }>;
  createdAt: Date;
  updatedAt: Date;
  selectedPricing: {
    hours: string;
    days: string;
    price: number;
  };
  selectedTime: string;
  selectedPayment: string;
  status: boolean;
  transactionId: string;
  transactionDate: string;
  transactionTime: string;
}

const PublicacionSchema = new mongoose.Schema<IPublication>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  esMayorDeEdad: { type: Boolean, required: true },
  nombre: { type: String, required: true },
  edad: { type: Number, required: true },
  telefono: { type: String, required: true },
  Categorias: { type: String, required: true },
  Pais: { type: String, required: true },
  Departamento: { type: String, required: true },
  ciudad: { type: String, required: true },
  Localidad: { type: String },
  direccion: { type: String },
  mostrarEnMaps: { type: Boolean },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  adicionales: { type: String, required: true },
  estado: {
    type: String,
    enum: ["PENDIENTE", "APROBADA", "RECHAZADA"],
    default: "PENDIENTE",
  },
  razon: { type: String },
  images: [
    {
      url: { type: String, required: true },
      isPrincipal: { type: Boolean, default: false },
      filename: { type: String, required: true },
      originalFilename: { type: String, required: true }, // AÑADIDO
    },
  ],
  videos: [
    {
      url: { type: String },
      filename: { type: String },
      originalFilename: { type: String }, // AÑADIDO
    },
  ],

  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },

  selectedPricing: {
    hours: { type: String },
    days: { type: String },
    price: { type: Number },
  },
  selectedTime: { type: String },
  selectedPayment: { type: String },
  status: { type: Boolean, default: false },
  transactionId: { type: String },
  transactionDate: { type: String },
  transactionTime: { type: String },
});

export default mongoose.model<IPublication>("Publicacion", PublicacionSchema);
