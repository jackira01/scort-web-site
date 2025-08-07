/** @type {import('next').NextConfig} */
import path from "path";

const nextConfig = {

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
   images: {
    domains: ['res.cloudinary.com'],
    },
  // experimental: {
  //  turbo: {
  //    resolveAlias: {
  //      underscore: "lodash",
  //    },
  //    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".json"],
  //  },
  //},
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
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
