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
      {
        // El protocolo puede ser http o https, dependiendo de cómo sirvas los archivos
        // desde Render. Si tienes dudas, puedes omitir 'protocol' para permitir ambos.
        protocol: "https", // <-- Si tu backend en Render usa HTTPS, pon "https". Si no, "http".
        hostname: "backend-2i85.onrender.com", // <-- El dominio que te da el error
        port: "", // Déjalo vacío si usas el puerto estándar (80 para http, 443 para https)
        pathname: "/uploads/**", // Permite cualquier imagen dentro de la carpeta /uploads
      },
    ],
    // Si usabas la propiedad 'domains' (ahora obsoleta pero podría estar en proyectos antiguos):
    // domains: ['res.cloudinary.com'], // Esta es la forma antigua, 'remotePatterns' es la recomendada
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://backend-2i85.onrender.com/:path*", // <-- Reemplaza esto
      },
    ];
  },
};

module.exports = nextConfig;
