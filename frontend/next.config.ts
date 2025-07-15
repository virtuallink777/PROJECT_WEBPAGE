// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // 1. Para las imágenes de Cloudinary (Producción)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // 2. Para el backend de Render (si en algún momento necesitas servir imágenes desde ahí)
      {
        protocol: "https", // Asumiendo que Render usa HTTPS
        hostname: "backend-2i85.onrender.com",
      },
      // 3. Para tu backend local (Desarrollo)
      {
        protocol: "http",
        hostname: "localhost",
        port: "4004", // El puerto de tu backend local
      },
    ],
  },

  compiler: {
    // Esto le dice al compilador de Next.js que elimine todos los console.log
    // únicamente en los builds de producción.
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = nextConfig;
