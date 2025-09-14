'use client';

import { useState } from 'react';
import Loader from '@/components/Loader';
import { Pagination } from '@/components/Pagination';
import { useAllUsers } from '@/hooks/use-all-users';
import ProfileVerificationCarousel from '@/modules/dashboard/components/ProfileVerificationCarousel';
import type { User } from '@/types/user.types';
import { transformedImages } from '../utils';
import { DashboardUserCard } from './DashbUserCard';

export const DashUserPanel = () => {
  const [verificationCarouselOpen, setVerificationCarouselOpen] =
    useState(false);
  const [selectedProfileForVerification, setSelectedProfileForVerification] =
    useState<User | null>();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const {
    data: usersData,
    isLoading,
    error,
  } = useAllUsers(currentPage, limit);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    // Error occurred
    return <div>Ups algo salio mal</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Usuarios
        </h1>
      </div>

      {/* Usuarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {usersData?.docs?.map((user: any, index: number) => (
          <DashboardUserCard
            key={user._id}
            user={user}
            index={index}
            setSelecteduserForVerification={setSelectedProfileForVerification}
            setVerificationCarouselOpen={setVerificationCarouselOpen}
          />
        ))}
      </div>

      {/* Paginación */}
      {usersData && usersData.totalPages > 1 && (
        <Pagination
          currentPage={usersData.currentPage}
          totalPages={usersData.totalPages}
          hasNextPage={usersData.hasNextPage}
          hasPrevPage={usersData.hasPrevPage}
          onPageChange={setCurrentPage}
          totalCount={usersData.totalCount}
          limit={usersData.limit}
        />
      )}

      {/* Profile Verification Carousel */}
      {selectedProfileForVerification && (
        <ProfileVerificationCarousel
          userId={selectedProfileForVerification._id}
          isOpen={verificationCarouselOpen}
          onOpenChange={setVerificationCarouselOpen}
          profileName={selectedProfileForVerification.name}
          images={transformedImages(
            selectedProfileForVerification.verificationDocument,
          )}
          isUserVerified={selectedProfileForVerification.isVerified}
        />
      )}
    </div>
  );
};
