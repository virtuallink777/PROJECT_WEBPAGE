import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

interface Filters {
  pais?: string;
  departamento?: string;
  ciudad?: string;
  localidad?: string;
  categorias?: string;
}

const getPublicationsNOTOP = async (req: Request, res: Response) => {
  const { Pais, Departamento, ciudad, Localidad, Categorias } = req.body;

  // Construir el objeto de filtros
  const filters: Filters = {};
  if (Pais) filters.pais = Pais;
  if (Departamento) filters.departamento = Departamento;
  if (ciudad) filters.ciudad = ciudad;
  if (Localidad) filters.localidad = Localidad;
  if (Categorias) filters.categorias = Categorias;
  try {
    const publicationsNOTOP = await Publicacion.find({
      ...filters,
      status: false,
      transactionId: { $exists: false }, // Asegura que transactionId NO EXISTA
      estado: { $nin: ["PENDIENTE", "RECHAZADA"] }, // Asegura que estado NO SEA "PENDIENTE" ni "RECHAZADA"
    });
    res.status(200).json(publicationsNOTOP);
  } catch (error) {
    console.error("Error al obtener las publicaciones:", error);
    res.status(500).json({ error: "Error al obtener las publicaciones NOTOP" });
  }
};

export default getPublicationsNOTOP;
