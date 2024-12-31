import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // Cambia el tamaño según tus necesidades
    },
  },
};

export default nextConfig;
