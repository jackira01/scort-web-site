import ProfileDetailLayout from '@/modules/profileDetails/components/ProfileDetailLayout';

export default function ProfileDetailPage({ params }: { params: { id: string } }) {
  return <ProfileDetailLayout id={params.id} />;
}
