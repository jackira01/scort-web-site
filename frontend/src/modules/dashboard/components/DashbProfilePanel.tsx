'use client';

import Loader from '@/components/Loader';
import { Pagination } from '@/components/Pagination';
import ManagePlansModal from '@/components/plans/ManagePlansModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminProfiles } from '@/hooks/use-admin-profiles';
import { useAllUsers } from '@/hooks/use-all-users';
import UploadStoryModal from '@/modules/account/components/UploadStoryModal';
import AdminProfileVerificationCarousel from '@/modules/dashboard/components/AdminProfileVerificationCarousel';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [limit] = useState(10);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userIdInput, setUserIdInput] = useState('');
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileIdInput, setProfileIdInput] = useState('');
  const [profileName, setProfileName] = useState<string | undefined>(undefined);
  const [profileId, setProfileId] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [isDeleted, setIsDeleted] = useState<boolean | undefined>(undefined);
  const [isVerified, setIsVerified] = useState<boolean | 'pending' | undefined>(undefined);

  // Obtener usuarios para el selector
  const { data: usersData, isLoading: isLoadingUsers } = useAllUsers(1, 100);

  const {
    data: profilesResponse,
    isLoading,
    error,
  } = useAdminProfiles(
    currentPage,
    limit,
    '_id,name,profileName,age,isActive,isDeleted,media,featured,location,verification,isVerified,planAssignment,upgrades,features',
    userId,
    profileName,
    profileId,
    isActive,
    isDeleted,
    isVerified
  );

  // Extraer los datos de la respuesta del nuevo endpoint
  const profilesData = profilesResponse?.success ? profilesResponse.data : null;

  // Resetear la página cuando cambi, isActive, isDeleted, isVerifieda el filtro de usuario
  useEffect(() => {
    setCurrentPage(1);
  }, [userId, profileName, profileId]);

  // Manejar la búsqueda por ID de usuario
  const handleUserIdSearch = () => {
    setUserId(userIdInput || undefined);
  };

  const handleProfileNameSearch = () => {
    setProfileName(profileNameInput || undefined);
  };

  const handleProfileIdSearch = () => {
    setProfileId(profileIdInput || undefined);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setUserId(undefined);
    setUserIdInput('');
    setProfileName(undefined);
    setProfileNameInput('');
    setProfileId(undefined);
    setProfileIdInput('');
    setIsActive(undefined);
    setIsDeleted(undefined);
    setIsVerified(undefined);
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
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Buscar por ID de usuario */}
          <div className="space-y-2">
            <Label htmlFor="userId">Buscar por ID de usuario</Label>
            <div className="flex gap-2">
              <Input
                id="userId"
                placeholder="ID del usuario"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUserIdSearch()}
              />
              <Button onClick={handleUserIdSearch} variant="secondary" size="icon">
                <span className="sr-only">Buscar</span>
                🔍
              </Button>
            </div>
          </div>

          {/* Buscar por Nombre de Perfil */}
          <div className="space-y-2">
            <Label htmlFor="profileName">Buscar por Nombre de Perfil</Label>
            <div className="flex gap-2">
              <Input
                id="profileName"
                placeholder="Nombre del perfil"
                value={profileNameInput}
                onChange={(e) => setProfileNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProfileNameSearch()}
              />
              <Button onClick={handleProfileNameSearch} variant="secondary" size="icon">
                <span className="sr-only">Buscar</span>
                🔍
              </Button>
            </div>
          </div>

          {/* Buscar por ID de Perfil */}
          <div className="space-y-2">
            <Label htmlFor="profileId">Buscar por ID de Perfil</Label>
            <div className="flex gap-2">
              <Input
                id="profileId"
                placeholder="ID del perfil (exacto)"
                value={profileIdInput}
                onChange={(e) => setProfileIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProfileIdSearch()}
              />
              <Button onClick={handleProfileIdSearch} variant="secondary" size="icon">
                <span className="sr-only">Buscar</span>
                🔍
              </Button>
            </div>
          </div>

          {/* Selector de usuario */}
          <div className="space-y-2">
            <Label htmlFor="userSelect">Seleccionar Usuario</Label>
            <Select
              value={userId || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  setUserId(undefined);
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

          {/* Filtro Activo */}
          <div className="space-y-2">
            <Label>Estado Activo</Label>
            <Select
              value={isActive === undefined ? 'all' : isActive ? 'true' : 'false'}
              onValueChange={(value) => setIsActive(value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Eliminado */}
          <div className="space-y-2">
            <Label>Estado Eliminado</Label>
            <Select
              value={isDeleted === undefined ? 'all' : isDeleted ? 'true' : 'false'}
              onValueChange={(value) => setIsDeleted(value === 'all' ? undefined : value === 'true')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Eliminados</SelectItem>
                <SelectItem value="false">No Eliminados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Verificado */}
          <div className="space-y-2">
            <Label>Estado Verificado</Label>
            <Select
              value={isVerified === undefined ? 'all' : isVerified === 'pending' ? 'pending' : isVerified ? 'true' : 'false'}
              onValueChange={(value) => {
                if (value === 'all') setIsVerified(undefined);
                else if (value === 'pending') setIsVerified('pending');
                else setIsVerified(value === 'true');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Verificados</SelectItem>
                <SelectItem value="pending">Verificación pendiente</SelectItem>
                <SelectItem value="false">No Verificados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botón limpiar filtros */}
        {(userId || profileName || profileId || isActive !== undefined || isDeleted !== undefined || isVerified !== undefined) && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>


      {/* Perfiles */}
      {profilesData?.docs?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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