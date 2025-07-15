export const metadata = {
  title: "Las mejores compañias",
  description: "Un mundo de placeres.",
  keywords: [
    "putas",
    "prepagos",
    "sexo",
    "webcam",
    "damas de compañia",
    "mujeres",
    "travestis",
    "putas en linea",
    "putas en vivo",
    "putas webcam",
    "putas prepagos",
    "putas en tu ciudad",
    "putas en tu pais",
    "putas en tu zona",
    "putas en tu barrio",
    "putas en tu casa",
    "putas en tu cama",
    "prepagos en linea",
    "prepagos en vivo",
    "prepagos webcam",
    "prepagos en tu ciudad",
    "prepagos en tu pais",
    "prepagos en tu zona",
    "prepagos en tu barrio",
    "prepagos en tu casa",
    "prepagos en tu cama",
    "sexo en linea",
    "sexo en vivo",
    "sexo webcam",
    "sexo en tu ciudad",
    "sexo en tu pais",
    "sexo en tu zona",
    "sexo en tu barrio",
    "sexo en tu casa",
    "sexo en tu cama",
  ],
  authors: [{ name: "Lujuria", url: "https://lujuria.com" }],
  creator: "Mi Agencia",
  metadataBase: new URL("https://lujuria.com"),
  openGraph: {
    title: "Las mejores compañias",
    description: "Un mundo de placeres",
    url: "https://lujuria.com",
    siteName: "Las mejores compañias",

    images: [
      {
        url: "/3d3.png",
        width: 1200,
        height: 630,
        alt: "las mejor compañia",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Las mejores compañias",
    description: "Un mundo de placeres",
    images: ["/3d3.png"],
    creator: "@lujuria",
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
