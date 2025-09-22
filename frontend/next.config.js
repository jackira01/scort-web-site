/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Configuración de compilación
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    domains: [
      "res.cloudinary.com",
      "images.unsplash.com",
      "via.placeholder.com",
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },

  compress: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/((?!auth).*)/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
          }/api/$1/:path*`,
      },
    ];
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@tanstack/react-query",
      "framer-motion",
    ],
    webVitalsAttribution: ["CLS", "LCP"],
    optimizeServerReact: true,
    serverMinification: true,
    serverSourceMaps: false,
  },

  webpack: (config, { dev, isServer, webpack }) => {
    // Fallbacks Node.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // 🔑 Alias para evitar cargar el UMD (cdn.js) de date-fns
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      "date-fns": path.dirname(require.resolve("date-fns/package.json")),
    };

    // 🚫 Elimina duplicados de self/global
    config.plugins = config.plugins.filter(
      (plugin) => !(plugin instanceof webpack.DefinePlugin)
    );

    // DefinePlugin único y limpio
    config.plugins.push(
      new webpack.DefinePlugin({
        global: "globalThis",
        self: "globalThis",
        "typeof self": JSON.stringify("object"),
      })
    );

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("browser-image-compression");
      config.externals.push("@editorjs/editorjs");
      config.externals.push("@editorjs/header");
      config.externals.push("@editorjs/list");
      config.externals.push("@editorjs/image");
      config.externals.push("@editorjs/quote");
      config.externals.push("@editorjs/embed");
    }

    if (!dev) {
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: { minChunks: 2, priority: -20, reuseExistingChunk: true },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: "react",
            priority: 20,
            chunks: "all",
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
            name: "ui",
            priority: 15,
            chunks: "all",
          },
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|lodash|clsx)[\\/]/,
            name: "utils",
            priority: 10,
            chunks: "all",
          },
        },
      };
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  env: {
    NEXT_PUBLIC_APP_NAME:
      process.env.NEXT_PUBLIC_APP_NAME || "Scort Web Site",
    NEXT_PUBLIC_APP_VERSION:
      process.env.npm_package_version || "1.0.0",
  },

  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true,
      },
    ];
  },

  trailingSlash: false,
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;
