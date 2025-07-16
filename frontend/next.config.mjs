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
  experimental: {
   turbo: {
     resolveAlias: {
       underscore: "lodash",
     },
     resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".json"],
   },
 },
};

export default nextConfig;
