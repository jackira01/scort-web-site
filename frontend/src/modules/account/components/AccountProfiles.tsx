'use client';

import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Plus,
  Shield,
  DollarSign,
  Star,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UploadStoryModal from './UploadStoryModal';
import DeleteProfileModal from './DeleteProfileModal';
import ManagePlansModal from '@/components/plans/ManagePlansModal';
import { deleteProfile, updateProfile, getProfileById } from '@/services/user.service';
import { useUpgradePurchase, useUpgradeValidation } from '@/hooks/use-upgrade-purchase';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { hasDestacadoUpgrade } from '@/utils/profile.utils';
import UpgradeModal from '@/components/upgrades/UpgradeModal';

interface ProfileResponse {
  _id: string;
  user: string;
  name: string;
  location: {
    country: { value: string; label: string } | string;
    department: { value: string; label: string } | string;
    city: { value: string; label: string } | string;
  };
  age: string;
  verification: {
    _id: string;
    verificationStatus: string;
    verificationProgress: number;
  };
  media?: {
    gallery?: string[];
    videos?: string[];
    audios?: string[];
    stories?: { _id: string; link: string; type: 'image' | 'video' }[];
  };
  planAssignment?: {
    planCode: string;
    variantDays: number;
    startAt: string | Date;
    expiresAt: string | Date;
  };
  upgrades?: Array<{
    code: string;
    startAt: string | Date;
    endAt: string | Date;
    purchaseAt: string | Date;
  }>;
  activeUpgrades?: Array<{
    code: string;
    startAt: string | Date;
    endAt: string | Date;
    purchaseAt: string | Date;
  }>;
  hasDestacadoUpgrade?: boolean;
  hasImpulsoUpgrade?: boolean;
  visible?: boolean;
  isActive?: boolean;
}

interface ProfileListProps {
  profiles: ProfileResponse[];
  getProgressColor: (percentage: number) => string;
  getProgressTextColor: (percentage: number) => string;
}

export default function AccountProfiles({
  profiles,
  getProgressColor,
  getProgressTextColor,
}: ProfileListProps) {
  const [uploadStoryModalOpen, setUploadStoryModalOpen] = useState(false);
  const [selectedProfileForStory, setSelectedProfileForStory] =
    useState<ProfileResponse | null>(null);
  const [previewStory, setPreviewStory] = useState<{
    link: string;
    type: 'image' | 'video';
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProfileForDelete, setSelectedProfileForDelete] =
    useState<ProfileResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [managePlansProfileId, setManagePlansProfileId] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradeProfile, setSelectedUpgradeProfile] = useState<ProfileResponse | null>(null);
  const [selectedUpgradeCode, setSelectedUpgradeCode] = useState<'DESTACADO' | 'IMPULSO' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 6;
  const queryClient = useQueryClient();

  // Calcular perfiles paginados
  const paginatedProfiles = useMemo(() => {
    const startIndex = (currentPage - 1) * profilesPerPage;
    const endIndex = startIndex + profilesPerPage;
    return profiles.slice(startIndex, endIndex);
  }, [profiles, currentPage]);

  const totalPages = Math.ceil(profiles.length / profilesPerPage);

  // Hooks para manejo de upgrades
  const { mutate: purchaseUpgrade, isPending: isPurchasing } = useUpgradePurchase();
  const { validateUpgrade } = useUpgradeValidation();

  const handleUpgradeClick = (profile: ProfileResponse, upgradeCode: 'DESTACADO' | 'IMPULSO') => {
    setSelectedUpgradeProfile(profile);
    setSelectedUpgradeCode(upgradeCode);
    setUpgradeModalOpen(true);
  };

  const handleUpgradePurchase = async (profileId: string, upgradeCode: 'DESTACADO' | 'IMPULSO') => {
    const profile = profiles.find(p => p._id === profileId);
    if (!profile) return;

    const validation = validateUpgrade(profile, upgradeCode);

    if (!validation.canPurchase) {
      toast.error(validation.reason || 'No se puede comprar este upgrade');
      return;
    }

    purchaseUpgrade(
      { profileId, upgradeCode },
      {
        onSuccess: () => {
          toast.success(`Upgrade ${upgradeCode} activado correctamente`);
          // Recargar para mostrar cambios
          setTimeout(() => window.location.reload(), 1000);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Error al activar el upgrade');
        }
      }
    );
  };



  const handleDeleteStory = async (profileId: string, storyIndex: number) => {
    try {
      // Encontrar el perfil en el estado local
      const profileToUpdate = profiles.find((p) => p._id === profileId);
      if (!profileToUpdate) return;

      // Obtener el perfil completo para preservar todos los datos de media
      toast.loading('Obteniendo datos del perfil...');
      const fullProfile = await getProfileById(profileId);

      // Filtrar la historia a eliminar por índice
      const updatedStories = (fullProfile.media?.stories || []).filter(
        (_: any, index: number) => index !== storyIndex,
      );

      // Actualizar el perfil preservando todos los datos de media
      toast.loading('Eliminando historia...');
      await updateProfile(profileId, {
        media: {
          gallery: fullProfile.media?.gallery || [],
          videos: fullProfile.media?.videos || [],
          audios: fullProfile.media?.audios || [],
          stories: updatedStories,
        },
      });

      toast.success('Historia eliminada correctamente');

      // Recargar la página para mostrar los cambios
      window.location.reload();
    } catch (error) {
      toast.dismiss();
      toast.error('Error al eliminar la historia');
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfileForDelete) return;

    try {
      setIsDeleting(true);
      toast.loading('Eliminando perfil...');

      await deleteProfile(selectedProfileForDelete._id);

      toast.dismiss();
      toast.success('Perfil eliminado correctamente');

      // Cerrar el modal
      setDeleteModalOpen(false);
      setSelectedProfileForDelete(null);

      // Actualizar solo la lista de perfiles sin recargar toda la página
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
    } catch (error) {
      toast.dismiss();
      toast.error('Error al ocultar el perfil');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (profile: ProfileResponse) => {
    setSelectedProfileForDelete(profile);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedProfileForDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Mis Perfiles
        </h1>
        <Link href="/cuenta/crear-perfil">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Perfil
          </Button>
        </Link>
      </div>
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
            <Plus className="h-12 w-12 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Aún no has creado perfiles
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Crea tu primer perfil para comenzar a conectar con personas
            increíbles
          </p>
          <Link href="/cuenta/crear-perfil">
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
              <Plus className="h-4 w-4 mr-2" />
              Crear mi primer perfil
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProfiles.map((profile, index) => (
              <Card
                key={profile._id}
                className={`group w-60 hover:shadow-xl transition-all duration-500 overflow-hidden  ${hasDestacadoUpgrade(profile as any)
                  ? 'bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-100 dark:from-yellow-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50'
                  : 'bg-card border-border hover:border-purple-500/50'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <Image
                    width={400}
                    height={300}
                    src={profile.media?.gallery?.[0] || '/placeholder.svg'}
                    alt={profile.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute top-3 right-3 flex space-x-2">
                    {profile.verification?.verificationStatus === 'Activo' && (
                      <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                        <CheckCircle className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-600 transition-colors duration-300">
                        {profile.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {profile.age} años
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {profile.location?.department &&
                            profile.location?.city &&
                            `${typeof profile.location.department === 'object' ? profile.location.department.label : profile.location.department}, ${typeof profile.location.city === 'object' ? profile.location.city.label : profile.location.city}`}
                        </span>
                      </div>
                    </div>
                    {/* <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="text-xs">
                      {profile.category}
                    </Badge>

                  </div> */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Verificación del perfil
                        </span>
                        <span
                          className={`font-medium ${getProgressTextColor(profile.verification?.verificationProgress)}`}
                        >
                          {profile.verification?.verificationProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(profile.verification?.verificationProgress)}`}
                          style={{
                            width: `${profile.verification?.verificationProgress}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Preview de historias existentes */}
                    {/* {profile.media?.stories && profile.media.stories.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Historias subidas</h4>
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {profile.media.stories.map((story, storyIndex) => (
                          <div key={storyIndex} className="relative flex-shrink-0 group">
                            <div
                              className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 border-purple-500 hover:border-purple-600 transition-colors"
                              onClick={() => setPreviewStory(story)}
                            >
                              {story.type === 'image' ? (
                                <Image
                                  src={story.link}
                                  alt="Historia"
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                                  <Play className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStory(profile._id, storyIndex);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )} */}

                    <div className="space-y-1 pt-2">
                      {/* Primera fila de botones */}
                      <div className="flex space-x-1 justify-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/cuenta/editar-perfil/${profile._id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="p-2 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar perfil</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/cuenta/verificar-perfil/${profile._id}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="p-2 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500 transition-all duration-200"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Verificar perfil</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {/* Botones de Upgrade */}
                        {/* Solo mostrar botón de Destacado si NO es plan DIAMANTE */}
                        {profile.planAssignment?.planCode !== 'DIAMANTE' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={hasDestacadoUpgrade(profile as any) ? "default" : "outline"}
                                  className={`p-2 ${hasDestacadoUpgrade(profile as any)
                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                                    : 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-500'
                                    } transition-all duration-200`}
                                  onClick={() => handleUpgradeClick(profile, 'DESTACADO')}
                                  disabled={hasDestacadoUpgrade(profile as any)}
                                >
                                  <Star className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{hasDestacadoUpgrade(profile as any) ? 'Destacado Activo' : 'Activar Destacado'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {/* Mostrar indicador de Destacado incluido para DIAMANTE */}
                        {profile.planAssignment?.planCode === 'DIAMANTE' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white cursor-default"
                                  disabled
                                >
                                  <Star className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Destacado incluido en plan Diamante</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant={profile.hasImpulsoUpgrade ? "default" : "outline"}
                                className={`p-2 ${profile.hasImpulsoUpgrade
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                                  : 'hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500'
                                  } transition-all duration-200`}
                                onClick={() => handleUpgradeClick(profile, 'IMPULSO')}
                                disabled={profile.hasImpulsoUpgrade}
                              >
                                <Zap className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{profile.hasImpulsoUpgrade ? 'Impulso Activo' : 'Activar Impulso'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {/* Segunda fila de botones */}
                      <div className="flex space-x-1 justify-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setManagePlansProfileId(profile._id)}
                                className="p-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 transition-all duration-200"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Administrar planes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedProfileForStory(profile);
                                  setUploadStoryModalOpen(true);
                                }}
                                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 transition-all duration-200"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Subir historia</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/perfil/${profile._id}`}>
                                <Button
                                  size="sm"
                                  className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver perfil</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDeleteModal(profile)}
                                className="p-2 hover:bg-red-600 transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Eliminar perfil</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Upload Story Modal */}
      {selectedProfileForStory && (
        <UploadStoryModal
          isOpen={uploadStoryModalOpen}
          onClose={() => {
            setUploadStoryModalOpen(false);
            setSelectedProfileForStory(null);
          }}
          profileId={selectedProfileForStory._id}
          profileName={selectedProfileForStory.name}
          currentStories={selectedProfileForStory.media?.stories || []}
        />
      )}

      {/* Story Preview Modal */}
      {previewStory && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setPreviewStory(null)}
          onKeyUp={(e) => {
            if (e.key === 'Escape') {
              setPreviewStory(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <button
            type="button"
            className="relative max-w-md max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden border-0 p-0"
            onClick={(e) => e.stopPropagation()}
            onKeyUp={(e) => {
              if (e.key === 'Escape') {
                setPreviewStory(null);
              }
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setPreviewStory(null)}
            >
              ×
            </Button>
            {previewStory.type === 'image' ? (
              <Image
                src={previewStory.link}
                alt="Historia preview"
                width={400}
                height={600}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={previewStory.link}
                controls
                className="w-full h-auto max-h-[80vh]"
                autoPlay
              >
                <track kind="captions" srcLang="es" label="Español" />
              </video>
            )}
          </button>
        </div>
      )}

      {/* Delete Profile Modal */}
      <DeleteProfileModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProfile}
        profile={selectedProfileForDelete}
        isDeleting={isDeleting}
      />

      {/* Modal para administrar planes */}
      <ManagePlansModal
        isOpen={!!managePlansProfileId}
        onClose={() => setManagePlansProfileId(null)}
        profileId={managePlansProfileId || ''}
        profileName={profiles.find(p => p._id === managePlansProfileId)?.name || ''}
        currentPlan={profiles.find(p => p._id === managePlansProfileId)?.planAssignment}
        onPlanChange={() => {
          // Invalidar queries para actualizar los datos
          queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
          queryClient.invalidateQueries({ queryKey: ['profilePlan', managePlansProfileId] });
        }}
      />

      {/* Modal para upgrades */}
      {selectedUpgradeProfile && selectedUpgradeCode && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => {
            setUpgradeModalOpen(false);
            setSelectedUpgradeProfile(null);
            setSelectedUpgradeCode(null);
          }}
          profileId={selectedUpgradeProfile._id}
          profile={selectedUpgradeProfile}
          upgradeCode={selectedUpgradeCode}
        />
      )}
    </div>
  );
}
