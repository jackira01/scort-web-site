import { Metadata } from 'next';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    categoria: string;
  }>;
}

// Generar metadata para la categoría
export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { categoria } = await params;

  return {
    title: {
      template: `%s | ${categoria.charAt(0).toUpperCase() + categoria.slice(1)} | Scort`,
      default: `${categoria.charAt(0).toUpperCase() + categoria.slice(1)} | Scort`,
    },
    description: `Explora los mejores servicios de ${categoria} en diferentes ubicaciones. Perfiles verificados y servicios de calidad.`,
    openGraph: {
      title: `${categoria.charAt(0).toUpperCase() + categoria.slice(1)} | Scort`,
      description: `Explora los mejores servicios de ${categoria} en diferentes ubicaciones`,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoriaLayout({ children, params }: LayoutProps) {
  const { categoria } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header específico de categoría si es necesario */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
              </h1>
              <p className="text-gray-600 mt-1">
                Encuentra los mejores servicios en tu ubicación
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer específico de categoría si es necesario */}
      <div className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Explora más servicios de {params.categoria} en diferentes ubicaciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}