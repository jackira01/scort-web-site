import ProfileDetailLayout from '@/modules/profileDetails/components/ProfileDetailLayout';
import { extractIdFromSlug } from '@/utils/slug';

// Forzar renderizado dinámico para evitar DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic';

export default async function ProfileDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Extraer el ID del slug usando la función helper
  const id = extractIdFromSlug(slug);

  return <ProfileDetailLayout id={id} />;
}
