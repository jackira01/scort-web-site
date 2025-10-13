'use client';

import { useState } from 'react';
import Loader from '@/components/Loader';
import { Pagination } from '@/components/Pagination';
import { useAdminProfiles } from '@/hooks/use-admin-profiles';
import AdminProfileVerificationCarousel from '@/modules/dashboard/components/AdminProfileVerificationCarousel';
import ManagePlansModal from '@/components/plans/ManagePlansModal';
import UploadStoryModal from '@/modules/account/components/UploadStoryModal';
import type { User } from '@/types/user.types';
import { transformedImages } from '../utils';
import { DashbProfileCard } from './DashbProfileCard';

export const DashProfilePanel = () => {
  const [verificationCarouselOpen, setVerificationCarouselOpen] =
    useState(false);
  const [selectedProfileForVerification, setSelectedProfileForVerification] =
    useState<any | null>();
  const [managePlansProfileId, setManagePlansProfileId] = useState<string | null>(null);
  const [selectedProfileForStory, setSelectedProfileForStory] = useState<any | null>(null);
  const [uploadStoryModalOpen, setUploadStoryModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(6);

  const {
    data: profilesResponse,
    isLoading,
    error,
  } = useAdminProfiles(currentPage, limit, '_id,name,profileName,age,isActive,media,featured,location,verification,isVerified');

  // Extraer los datos de la respuesta del nuevo endpoint
  const profilesData = profilesResponse?.success ? profilesResponse.data : null;

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    // Error occurred
    return <div>Ups algo salio mal</div>;
  }

  // profilesData loaded

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-200">
          Perfiles
        </h1>
      </div>

      {/* Perfiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {profilesData?.docs?.map((profile: any, index: number) => (
          <DashbProfileCard
            key={profile._id}
            profile={profile}
            index={index}
            setSelectedProfileForVerification={setSelectedProfileForVerification}
            setVerificationCarouselOpen={setVerificationCarouselOpen}
            setManagePlansProfileId={setManagePlansProfileId}
            setSelectedProfileForStory={setSelectedProfileForStory}
            setUploadStoryModalOpen={setUploadStoryModalOpen}
          />
        ))}
      </div>

      {/* Paginación */}
      {profilesData && profilesData.totalPages > 1 && (
        <Pagination
          currentPage={profilesData.page}
          totalPages={profilesData.totalPages}
          hasNextPage={profilesData.hasNextPage}
          hasPrevPage={profilesData.hasPrevPage}
          onPageChange={setCurrentPage}
          totalCount={profilesData.totalDocs}
          limit={profilesData.limit}
        />
      )}

      {/* Admin Profile Verification Carousel */}
      {selectedProfileForVerification && (
        <AdminProfileVerificationCarousel
          isOpen={verificationCarouselOpen}
          onOpenChange={setVerificationCarouselOpen}
          profileName={selectedProfileForVerification.profileName || selectedProfileForVerification.name}
          profileId={selectedProfileForVerification._id}
        />
      )}

      {/* Manage Plans Modal */}
      {managePlansProfileId && (
        <ManagePlansModal
          isOpen={!!managePlansProfileId}
          onClose={() => setManagePlansProfileId(null)}
          profileId={managePlansProfileId}
          profileName={profilesData?.docs?.find((p: any) => p._id === managePlansProfileId)?.profileName || profilesData?.docs?.find((p: any) => p._id === managePlansProfileId)?.name || ''}
          currentPlan={profilesData?.docs?.find((p: any) => p._id === managePlansProfileId)?.planAssignment}
          onPlanChange={() => {
            // Invalidar queries para actualizar los datos
            // queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
          }}
        />
      )}

      {/* Upload Story Modal */}
      {selectedProfileForStory && (
        <UploadStoryModal
          isOpen={uploadStoryModalOpen}
          onClose={() => setUploadStoryModalOpen(false)}
          profileId={selectedProfileForStory._id}
          profileName={selectedProfileForStory.profileName || selectedProfileForStory.name}
          currentStories={selectedProfileForStory.media?.stories || []}
        />
      )}
    </div>
  );
};