import { EditProfileLayout } from '@/modules/edit-profile';

interface EditProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const { id } = await params;
  return <EditProfileLayout profileId={id} />;
}