// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // o lo que tengas
  // ... otras configuraciones que puedas tener ...

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "", // Dejar vacío si no hay puerto específico (Cloudinary usa el estándar 443 para https)
        pathname: "/**", // Permite cualquier ruta dentro de ese hostname. Puedes ser más específico si quieres.
        // Por ejemplo: '/denydgtrp/image/upload/**' si tu cloud_name es denydgtrp
      },
      // Puedes añadir más objetos aquí para otros dominios permitidos
      {
        protocol: "http", // OJO: es http para localhost
        hostname: "localhost",
        port: "4004", // El puerto de tu backend
        pathname: "/uploads/**", // O la ruta específica donde sirves archivos
      },
    ],
    // Si usabas la propiedad 'domains' (ahora obsoleta pero podría estar en proyectos antiguos):
    // domains: ['res.cloudinary.com'], // Esta es la forma antigua, 'remotePatterns' es la recomendada
  },
};

module.exports = nextConfig;
