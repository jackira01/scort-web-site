import { ProfileVerificationForm } from '@/modules/profile-verification/components/ProfileVerificationForm';

export default async function VerifyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <ProfileVerificationForm profileId={id} />
      </div>
    </div>
  );
}