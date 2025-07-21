export const metadata = {
  // --- SEO BÁSICO (Lo más importante para Google) ---
  title: "Lujuria: Damas de Compañía, Escorts y Prepagos en Colombia",
  description:
    "Encuentra las mejores damas de compañía, escorts, travestis y prepagos en tu ciudad. Perfiles verificados, fotos reales y contacto directo en Lujuria.",
  keywords: [
    "damas de compañía",
    "escorts",
    "prepagos",
    "travestis",
    "agencias de escorts",
    "prepagos colombia",
    "escorts bogotá",
    "prepagos medellín",
    "damas de compañía cali",
    "sexo en colombia",
    "webcam colombia",
  ],

  // --- INFORMACIÓN DEL SITIO (Importante y corregido) ---
  authors: [{ name: "Lujuria", url: "https://prepagoslujuria.com" }],
  creator: "Lujuria",
  // La URL base para todas las URLs relativas en los metadatos. ¡CRÍTICO!
  metadataBase: new URL("https://prepagoslujuria.com"),

  // --- OPEN GRAPH (Para compartir en Facebook, WhatsApp, etc.) ---
  openGraph: {
    title: "Lujuria: Damas de Compañía, Escorts y Prepagos en Colombia", // Título consistente
    description:
      "Perfiles verificados, fotos reales y contacto directo en las principales ciudades de Colombia.", // Descripción concisa y atractiva
    url: "https://prepagoslujuria.com", // La URL canónica
    siteName: "Lujuria", // El nombre de tu sitio/marca
    images: [
      {
        url: "/3d3.png", // URL a una imagen específica para compartir (idealmente 1200x630px)
        width: 1200,
        height: 630,
        alt: "Lujuria - Damas de Compañía y Escorts en Colombia",
      },
    ],
    locale: "es_CO", // Más específico para Colombia
    type: "website",
  },

  // --- TWITTER CARD (Para compartir en Twitter/X) ---
  twitter: {
    card: "summary_large_image",
    title: "Lujuria: Damas de Compañía, Escorts y Prepagos en Colombia", // Título consistente
    description:
      "Perfiles verificados y contacto directo. Encuentra damas de compañía, escorts y prepagos en tu ciudad.",
    images: ["/3d3.png"], // URL a una imagen específica para Twitter (idealmente 1200x675px)
    creator: "@TuUsuarioDeTwitter", // Opcional: si tienes un usuario de Twitter para la marca
  },
};

import Home from "@/components/home";
import FilterBar from "@/components/FilterBar";

export default function HomePage() {
  return (
    <div>
      <FilterBar />
      <Home />
    </div>
  );
}
