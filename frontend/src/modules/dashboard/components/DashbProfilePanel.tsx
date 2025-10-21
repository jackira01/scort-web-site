'use client';

import { useState, useEffect } from 'react';
import Loader from '@/components/Loader';
import { Pagination } from '@/components/Pagination';
import { useAdminProfiles } from '@/hooks/use-admin-profiles';
import { useAllUsers } from '@/hooks/use-all-users';
import AdminProfileVerificationCarousel from '@/modules/dashboard/components/AdminProfileVerificationCarousel';
import ManagePlansModal from '@/components/plans/ManagePlansModal';
import UploadStoryModal from '@/modules/account/components/UploadStoryModal';
import { DashbProfileCard } from './DashbProfileCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdInput, setUserIdInput] = useState('');

  // Obtener usuarios para el selector
  const { data: usersData, isLoading: isLoadingUsers } = useAllUsers(1, 100);

  const {
    data: profilesResponse,
    isLoading,
    error,
  } = useAdminProfiles(currentPage, limit, '_id,name,profileName,age,isActive,media,featured,location,verification,isVerified', userId);

  // Extraer los datos de la respuesta del nuevo endpoint
  const profilesData = profilesResponse?.success ? profilesResponse.data : null;

  // Resetear la página cuando cambia el filtro de usuario
  useEffect(() => {
    setCurrentPage(1);
  }, [userId]);

  // Manejar la búsqueda por ID de usuario
  const handleUserIdSearch = () => {
    setUserId(userIdInput || null);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setUserId(null);
    setUserIdInput('');
  };

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

      {/* Filtros */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 p-4 border rounded-lg bg-muted/30">
        {/* Buscar por ID */}
        <div className="w-full md:w-1/3 space-y-2">
          <Label htmlFor="userId">Buscar por ID de usuario</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="userId"
              placeholder="Ingresa el ID del usuario"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUserIdSearch()}
            />
            <Button onClick={handleUserIdSearch} variant="secondary" className="w-full sm:w-auto">
              Buscar
            </Button>
          </div>
        </div>

        {/* Selector de usuario */}
        <div className="w-full md:w-1/3 space-y-2">
          <Label htmlFor="userSelect">Seleccionar Usuario</Label>
          <Select
            value={userId || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                setUserId(null);
                setUserIdInput('');
              } else {
                setUserId(value);
                setUserIdInput(value);
              }
            }}
          >
            <SelectTrigger id="userSelect" className="w-full">
              <SelectValue placeholder="Seleccionar usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {usersData?.docs?.map((user: any) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.username || user.email || user._id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botón limpiar filtros */}
        {userId && (
          <div className="w-full md:w-auto flex justify-center md:justify-end">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>


      {/* Perfiles */}
      {/* Perfiles */}
      {profilesData?.docs?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {profilesData.docs.map((profile: any, index: number) => (
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
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            {userId
              ? 'Este usuario no tiene perfiles creados.'
              : 'No hay perfiles disponibles.'}
          </p>
        </div>
      )}


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