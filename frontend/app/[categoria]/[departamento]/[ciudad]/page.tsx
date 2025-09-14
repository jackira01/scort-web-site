import { Metadata } from 'next';

// Forzar renderizado dinámico para evitar DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    categoria: string;
    departamento: string;
    ciudad: string;
  }>;
}

// Configuración para ISR - no precompilamos rutas en build time
export async function generateStaticParams() {
  return []; // Array vacío para permitir generación dinámica
}

// Función para obtener datos con ISR
async function getData(categoria: string, departamento: string, ciudad: string) {
  try {
    // Durante el build, evitar llamadas a la API
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
      return {
        message: 'Build time data',
        categoria,
        departamento,
        ciudad
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${baseUrl}/api/escorts/location/${categoria}/${departamento}/${ciudad}`;

    const response = await fetch(url, {
      next: {
        revalidate: 3600 // ISR: revalidar cada hora
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Datos no encontrados
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching location data:', error);
    // Durante el build, devolver datos mock en lugar de null
    return {
      message: 'Fallback data',
      categoria,
      departamento,
      ciudad
    };
  }
}

// Generar metadata dinámicamente
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria, departamento, ciudad } = await params;

  return {
    title: `${categoria} en ${ciudad}, ${departamento} | Scort`,
    description: `Encuentra los mejores ${categoria} en ${ciudad}, ${departamento}. Perfiles verificados y servicios de calidad.`,
    openGraph: {
      title: `${categoria} en ${ciudad}, ${departamento}`,
      description: `Encuentra los mejores ${categoria} en ${ciudad}, ${departamento}`,
    },
  };
}

export default async function LocationPage({ params }: PageProps) {
  const { categoria, departamento, ciudad } = await params;

  // Obtener datos con ISR
  const data = await getData(categoria, departamento, ciudad);

  // Renderizar siempre el contenido, sin verificaciones dinámicas
  // Si no hay datos, mostrar contenido por defecto

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {categoria.charAt(0).toUpperCase() + categoria.slice(1)} en {ciudad}, {departamento}
        </h1>
        <nav className="text-sm text-gray-600">
          <span>Inicio</span>
          <span className="mx-2">/</span>
          <span>{categoria}</span>
          <span className="mx-2">/</span>
          <span>{departamento}</span>
          <span className="mx-2">/</span>
          <span className="font-medium">{ciudad}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(data) ? (
          data.map((item: any, index: number) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">{item.title || item.name}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="text-sm text-gray-500">
                <p>Ubicación: {ciudad}, {departamento}</p>
                <p>Categoría: {categoria}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Información de {ciudad}</h2>
              <p className="text-gray-600 mb-4">
                Explora los servicios disponibles en {ciudad}, {departamento}
              </p>
              <div className="text-sm text-gray-500">
                <p>Categoría: {categoria}</p>
                <p>Ubicación: {ciudad}, {departamento}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Información adicional de la ubicación */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Sobre {ciudad}, {departamento}</h2>
        <p className="text-gray-700 leading-relaxed">
          Descubre los mejores servicios de {categoria} en {ciudad}, {departamento}.
          Nuestra plataforma te conecta con perfiles verificados y servicios de calidad
          en tu área local.
        </p>
      </div>
    </div>
  );
}