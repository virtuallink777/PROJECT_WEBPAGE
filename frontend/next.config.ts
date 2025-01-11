/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // Ajusta según tus necesidades
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4004",
        pathname: "/uploads/**", // Ajusta según tu estructura de URLs
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4004/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
