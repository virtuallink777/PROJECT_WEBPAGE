// src/services/types.ts
export interface Image {
  url: string;
  filename: string;
  isPrincipal: boolean;
}

export interface Video {
  url: string;
  filename: string;
}

export interface Publication {
  userId: string;
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
  images?: Image[]; // Opcional según la respuesta del backend
  videos?: Video[];
}

export interface BackendResponse {
  message: string;
  publicacion: Publication;
}
