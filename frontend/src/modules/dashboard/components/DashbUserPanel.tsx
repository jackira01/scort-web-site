'use client';

import { useEffect, useState } from 'react';
import Loader from '@/components/Loader';
import { usePaginatedUsers } from '@/hooks/use-user';
import ProfileVerificationCarousel from '@/modules/dashboard/components/ProfileVerificationCarousel';
import type { User } from '@/types/user.types';
import { transformedImages } from '../utils';
import { DashboardUserCard } from './DashbUserCard';
import { PaginatedNavigation } from './DashPagination';

export const DashUserPanel = () => {
  const [verificationCarouselOpen, setVerificationCarouselOpen] =
    useState(false);
  const [selectedProfileForVerification, setSelectedProfileForVerification] =
    useState<User | null>();

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const {
    data: usersData,
    isLoading,
    error,
  } = usePaginatedUsers(currentPage, limit, {});

  useEffect(() => {
    if (usersData) {
      setTotalPages(usersData.totalPages || 1);
    }
    return () => {
      // Solo se ejecuta cuando el componente se desmonta completamente
      setTotalPages(1);
    };
  }, [usersData]);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    console.error(error);
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
        {usersData?.docs.map((user, index) => (
          <DashboardUserCard
            key={user._id}
            user={user}
            index={index}
            setSelecteduserForVerification={setSelectedProfileForVerification}
            setVerificationCarouselOpen={setVerificationCarouselOpen}
          />
        ))}
      </div>

      {/* Pagination */}
      <PaginatedNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
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
        />
      )}
    </div>
  );
};
