import ProfileDetailLayout from '@/modules/profileDetails/components/ProfileDetailLayout';

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProfileDetailLayout id={id} />;
}
