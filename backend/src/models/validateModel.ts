import mongoose from "mongoose";

const ValidacionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    estado: { type: String, required: true },
    razon: { type: String },
    images: { type: [String], required: true }, // Guardar las rutas de las imágenes
    fotoCartel: { type: String }, // Ruta de la foto del cartel
    fotoRostro: { type: String }, // Ruta de la foto del rostro
    email: { type: String, required: true },
    muestraRostro: { type: String, required: true },
    shippingDateValidate: { type: String, required: true },
  },
  { timestamps: true }
);

export const Validacion = mongoose.model(
  "ValidacionPendiente",
  ValidacionSchema
);
