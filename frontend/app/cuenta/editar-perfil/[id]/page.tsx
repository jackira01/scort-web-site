import { EditProfileLayout } from '@/modules/edit-profile';

interface EditProfilePageProps {
  params: {
    id: string;
  };
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  return <EditProfileLayout profileId={params.id} />;
}