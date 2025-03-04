import { Request, Response } from "express";
import Publicacion from "../models/publications.models";

interface Filters {
  pais?: string;
  departamento?: string;
  ciudad?: string;
  localidad?: string;
  categorias?: string;
}

const getPublicationsTOP = async (req: Request, res: Response) => {
  const { Pais, Departamento, ciudad, Localidad, Categorias } = req.body;

  const filters: Filters = {};
  if (Pais) filters.pais = Pais;
  if (Departamento) filters.departamento = Departamento;
  if (ciudad) filters.ciudad = ciudad;
  if (Localidad) filters.localidad = Localidad;
  if (Categorias) filters.categorias = Categorias;

  try {
    // Si no hay filtros, se devuelven todas las publicaciones TOP
    const publications = await Publicacion.find({
      ...filters,
      status: true,
      transactionId: { $exists: true, $ne: null }, // Asegura que transactionId exista y no sea null
    });
    res.status(200).json(publications);
  } catch (error) {
    console.error("Error al obtener las publicaciones TOP:", error);
    res.status(500).json({ error: "Error al obtener las publicaciones TOP" });
  }
};

export default getPublicationsTOP;
