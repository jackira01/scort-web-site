import { API_URL } from '@/lib/config';
import ProfileDetailLayout from '@/modules/profileDetails/components/ProfileDetailLayout';
import { extractIdFromSlug } from '@/utils/slug';
import type { Metadata } from 'next';

// Forzar renderizado dinámico para evitar DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);

  try {
    // Fetch profile data directly from API
    // Usamos fetch en lugar de axios para evitar problemas con interceptores del lado del cliente en el servidor
    const response = await fetch(`${API_URL}/api/profile/${id}`, {
      next: { revalidate: 60 } // Cache por 1 minuto
    });

    if (!response.ok) {
      return {
        title: 'Perfil no encontrado',
        description: 'El perfil que buscas no está disponible.'
      };
    }

    const profile = await response.json();

    const title = profile.name || 'Perfil';
    const description = profile.description || `Mira el perfil de ${title} en nuestra plataforma.`;

    // Obtener la primera imagen de la galería
    const images = [];
    if (profile.media?.gallery && profile.media.gallery.length > 0) {
      images.push({
        url: profile.media.gallery[0],
        width: 1200,
        height: 630,
        alt: `Foto de ${title}`,
      });
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: images.map(img => img.url),
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Perfil',
      description: 'Detalle del perfil'
    };
  }
}

export default async function ProfileDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Extraer el ID del slug usando la función helper
  const id = extractIdFromSlug(slug);

  return <ProfileDetailLayout id={id} />;
}
