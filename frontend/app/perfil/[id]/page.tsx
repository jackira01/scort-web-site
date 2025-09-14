import ProfileDetailLayout from '@/modules/profileDetails/components/ProfileDetailLayout';

// Forzar renderizado dinámico para evitar DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic';

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileDetailLayout id={id} />;
}
