// src>app>layout.tsx

import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SocketProvider } from "@/context/SocketContext"; // <-- 1. IMPORTAR

export const metadata = {
  title: "Lujuria: Las mejores compañias",
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
    title: "Lujuria: Las mejores compañias",
    description: "Un mundo de placeres",
    url: "https://lujuria.com",
    siteName: "Lujuria: Las mejores compañias",

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/3d3.png" type="image/png" sizes="128x128" />
        {/* Puedes añadir más cosas aquí */}
      </head>

      <SocketProvider>
        <body className="min-h-screen flex flex-col antialiased bg-rose-100 bg-opacity-50 ">
          <Navbar />

          <main className="flex-grow ">{children}</main>

          <Footer />
        </body>
      </SocketProvider>
    </html>
  );
}
