/** @type {import('next').NextConfig} */

const nextConfig = {
  // Configuración de compilación
  typescript: {
    // Ignorar errores de TypeScript durante el build en producción
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignorar errores de ESLint durante el build
    ignoreDuringBuilds: false,
  },

  // Configuración del compilador nativo de Next.js
  compiler: {
    // Eliminar console.log en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Configuración de imágenes
  images: {
    domains: [
      'res.cloudinary.com',
      'images.unsplash.com',
      'via.placeholder.com'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configuración de compresión
  compress: true,

  // Configuración de headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ];
  },

  // Configuración de rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/((?!auth).*)/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/$1/:path*`
      }
    ];
  },

  // Configuración de optimización avanzada
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@tanstack/react-query',
      'framer-motion'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    webVitalsAttribution: ['CLS', 'LCP'],
    optimizeServerReact: true,
    serverMinification: true,
    serverSourceMaps: false,
  },

  // Configuración de webpack optimizada
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimizaciones para producción
    if (!dev) {
      // Configuración avanzada de splitChunks
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            chunks: 'all',
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
            name: 'ui',
            priority: 15,
            chunks: 'all',
          },
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|lodash|clsx)[\\/]/,
            name: 'utils',
            priority: 10,
            chunks: 'all',
          },
        },
      };



      // Optimizar imports dinámicos
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Configurar alias para imports más eficientes
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    return config;
  },

  // Configuración de output para standalone (deshabilitado temporalmente por permisos)
  // output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Scort Web Site',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },

  // Configuración de redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true,
      },
    ];
  },

  // Configuración de trailing slash
  trailingSlash: false,

  // Configuración de poweredByHeader
  poweredByHeader: false,

  // Configuración de reactStrictMode
  reactStrictMode: true,
};

module.exports = nextConfig;