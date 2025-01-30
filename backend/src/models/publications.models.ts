import mongoose from "mongoose";
import { Document } from "mongoose";

interface IPublication extends Document {
  userId: mongoose.Schema.Types.ObjectId; // relacion con el usuario

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
  images: Array<{
    url: string;
    isPrincipal: boolean;
    filename: string;
  }>;
  videos: Array<{
    url: string;
    filename: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PublicacionSchema = new mongoose.Schema<IPublication>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  esMayorDeEdad: { type: Boolean, required: true },
  nombre: { type: String, required: true },
  edad: { type: Number, required: true },
  telefono: { type: String, required: true },
  Categorias: { type: String, required: true },
  Pais: { type: String, required: true },
  Departamento: { type: String, required: true },
  ciudad: { type: String, required: true },
  Localidad: { type: String, required: true },
  direccion: { type: String },
  mostrarEnMaps: { type: Boolean },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  adicionales: { type: String, required: true },
  images: [
    {
      url: { type: String, required: true },
      isPrincipal: { type: Boolean, default: false },
      filename: { type: String, required: true },
    },
  ],
  videos: [
    {
      url: { type: String },
      filename: { type: String },
    },
  ],

  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
});

export default mongoose.model<IPublication>("Publicacion", PublicacionSchema);
