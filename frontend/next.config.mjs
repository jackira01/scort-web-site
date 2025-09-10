/** @type {import('next').NextConfig} */
import path from "path";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración para forzar renderizado estático
  experimental: {
    staticWorkerRequestDeduping: true,
  },
  // Configuración para manejo de errores dinámicos
  // output: 'standalone', // Comentado porque no es compatible con pnpm run start
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  // Configuración experimental para Turbopack
  experimental: {
    turbo: {
      resolveAlias: {
        underscore: "lodash",
      },
      resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".json"],
    },
  },
  // Configuración para ffmpeg.wasm
  webpack: (config, { isServer }) => {
    // Configuración para ffmpeg.wasm
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
  // Headers necesarios para SharedArrayBuffer (requerido por ffmpeg.wasm)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      // Headers específicos para imágenes de Cloudinary
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
