'use client';

import { useState } from 'react';
import Loader from '@/components/Loader';
import { Pagination } from '@/components/Pagination';
import { useAllProfiles } from '@/hooks/use-all-profiles';
import AdminProfileVerificationCarousel from '@/modules/dashboard/components/AdminProfileVerificationCarousel';
import type { User } from '@/types/user.types';
import { transformedImages } from '../utils';
import { DashbProfileCard } from './DashbProfileCard';

export const DashProfilePanel = () => {
  const [verificationCarouselOpen, setVerificationCarouselOpen] =
    useState(false);
  const [selectedProfileForVerification, setSelectedProfileForVerification] =
    useState<any | null>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const {
    data: profilesData,
    isLoading,
    error,
  } = useAllProfiles(currentPage, limit, '_id,name,age,isActive,media');

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
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Perfiles
        </h1>
      </div>

      {/* Perfiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profilesData?.docs?.map((profile, index) => (
          <DashbProfileCard
            key={profile._id}
            profile={profile}
            index={index}
            setSelectedProfileForVerification={setSelectedProfileForVerification}
            setVerificationCarouselOpen={setVerificationCarouselOpen}
          />
        ))}
      </div>
      
      {/* Paginación */}
      {profilesData && profilesData.totalPages > 1 && (
        <Pagination
          currentPage={profilesData.currentPage}
          totalPages={profilesData.totalPages}
          hasNextPage={profilesData.hasNextPage}
          hasPrevPage={profilesData.hasPrevPage}
          onPageChange={setCurrentPage}
          totalCount={profilesData.totalCount}
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
    </div>
  );
};