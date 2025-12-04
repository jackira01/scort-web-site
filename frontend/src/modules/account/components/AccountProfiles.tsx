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
  Rocket,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProfileSlug } from '@/utils/slug';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UploadStoryModal from './UploadStoryModal';
import DeleteProfileModal from './DeleteProfileModal';
import ManagePlansModal from '@/components/plans/ManagePlansModal';
import UnifiedUpgradesModal from '@/components/upgrades/UnifiedUpgradesModal';
import { deleteProfile, updateProfile, getProfileById } from '@/services/user.service';
import { validateMaxProfiles } from '@/services/profile-validation.service';
import { useUpgradePurchase, useUpgradeValidation } from '@/hooks/use-upgrade-purchase';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { hasDestacadoUpgrade } from '@/utils/profile.utils';

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
  const [upgradesModalOpen, setUpgradesModalOpen] = useState(false);
  const [selectedUpgradeProfile, setSelectedUpgradeProfile] = useState<ProfileResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const profilesPerPage = 6;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const { data: session } = useSession();

  // Redireccionar al home si se borra el último perfil
  const prevProfilesLength = useRef(profiles.length);

  useEffect(() => {
    if (prevProfilesLength.current > 0 && profiles.length === 0) {
      router.push('/');
    }
    // Si la página actual queda vacía y no es la primera, ir a la anterior
    const totalPages = Math.ceil(profiles.length / profilesPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    prevProfilesLength.current = profiles.length;
  }, [profiles, router, currentPage, profilesPerPage]);

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

  const handleUpgradesClick = (profile: ProfileResponse) => {
    setSelectedUpgradeProfile(profile);
    setUpgradesModalOpen(true);
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

  /**
   * VALIDACIÓN A: Verificar límite total antes de redirigir al wizard
   */
  const handleCreateProfile = async (e: React.MouseEvent) => {
    console.log('🔴 [CUENTA] Botón "Nuevo Perfil" clickeado');
    e.preventDefault();

    // Obtener userId de la sesión
    const userId = (session?.user as any)?._id || (session?.user as any)?.id;

    if (!userId) {
      console.error('❌ [CUENTA] No hay sesión activa');
      toast.error('Debes iniciar sesión para crear un perfil');
      return;
    }

    console.log('🔴 [CUENTA] Iniciando validación con userId:', userId);
    setIsValidating(true);

    try {
      console.log('🔴 [CUENTA] Llamando a validateMaxProfiles()...');
      const validation = await validateMaxProfiles(userId);
      console.log('🔴 [CUENTA] Resultado de validación:', validation);

      if (!validation.ok) {
        console.warn('⚠️ [CUENTA] Validación falló:', validation.message);
        toast.error(validation.message || 'Has alcanzado el límite de perfiles');
        return;
      }

      console.log('✅ [CUENTA] Validación exitosa, redirigiendo a wizard...');
      // Validación pasó, redirigir al wizard
      router.push('/cuenta/crear-perfil');

    } catch (error) {
      console.error('❌ [CUENTA] Error al validar perfiles:', error);
      toast.error('Error al validar. Intenta nuevamente.');
    } finally {
      console.log('🔴 [CUENTA] Finalizando validación, isValidating = false');
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-700 dark:text-white bg-clip-text">
          Mis Perfiles
        </h1>
        <Button
          onClick={handleCreateProfile}
          disabled={isValidating}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isValidating ? 'Validando...' : 'Nuevo Perfil'}
        </Button>
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
          <Button
            onClick={handleCreateProfile}
            disabled={isValidating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isValidating ? 'Validando...' : 'Crear mi primer perfil'}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center place-items-center">

            {paginatedProfiles.map((profile, index) => (
              <Card
                key={profile._id}
                className={`group relative w-60 h-96 hover:shadow-xl transition-all duration-500 overflow-hidden ${hasDestacadoUpgrade(profile as any)
                  ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50'
                  : 'border-border hover:border-purple-500/50'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Imagen de fondo a altura completa */}
                <div className="absolute inset-0">
                  <Image
                    width={400}
                    height={600}
                    src={profile.media?.gallery?.[0] || '/placeholder.svg'}
                    alt={profile.name || 'Foto de perfil'}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay gradient siempre visible para legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Badge de verificación siempre visible */}
                <div className="absolute top-3 right-3 z-10 flex space-x-2">
                  {profile.verification?.verificationStatus === 'check' && (
                    <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                      <CheckCircle className="h-3 w-3" />
                    </Badge>
                  )}
                </div>

                {/* Badges de Destacado e Impulso siempre visibles */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                  {hasDestacadoUpgrade(profile as any) && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Destacado
                    </Badge>
                  )}
                  {profile.hasImpulsoUpgrade && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Zap className="h-3 w-3 mr-1" />
                      Impulso
                    </Badge>
                  )}
                </div>

                {/* Contenido con animación - aparece en hover y pulsa periódicamente */}
                <CardContent className="pulse-content absolute inset-0 p-4 flex flex-col justify-end z-10 pointer-events-none group-hover:pointer-events-auto">                  <div className="space-y-3 bg-black/60 backdrop-blur-sm rounded-lg p-4">
                  <div>
                    <h3 className="font-semibold text-lg text-white">
                      {profile.name}
                    </h3>
                    <div className="flex flex-col space-y-1 text-sm text-white/80 mt-1">
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/80">
                        Verificación del perfil
                      </span>
                      <span
                        className={`font-medium ${getProgressTextColor(profile.verification?.verificationProgress ?? 0)}`}
                      >
                        {profile.verification?.verificationProgress ?? 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(profile.verification?.verificationProgress ?? 0)}`}
                        style={{
                          width: `${profile.verification?.verificationProgress ?? 0}%`,
                        }}
                      />
                    </div>
                  </div>

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
                                className="p-2 bg-white/90 dark:bg-gray-800 hover:bg-white hover:border-blue-500 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4 text-foreground" />
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
                                className="p-2 bg-white/90 dark:bg-gray-800 hover:bg-white hover:border-blue-500 transition-all duration-200"
                              >
                                <Shield className="h-4 w-4 text-foreground" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Verificar perfil</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {/* Botones de Upgrade */}
                      {/* Botón unificado de Mejoras (Upgrades) */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-2 bg-white/90 dark:bg-gray-800 hover:bg-white hover:border-blue-500 transition-all duration-200"
                              onClick={() => handleUpgradesClick(profile)}
                            >
                              <Rocket className="h-4 w-4 text-purple-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mejoras del perfil</p>
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
                              className="p-2 bg-white/90 dark:bg-gray-800 hover:bg-white hover:border-blue-500 transition-all duration-200"
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
                              className="p-2 bg-white/90 dark:bg-gray-800 hover:bg-white hover:border-blue-500 transition-all duration-200"
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
                            <Link href={`/perfil/${createProfileSlug(profile.name, profile._id)}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="p-2 bg-white/90 dark:bg-gray-800 hover:bg-white hover:border-blue-500 transition-all duration-200"
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
                              <Trash2 className="h-4 w-4 text-white" />
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

      {/* Modal unificado de mejoras/upgrades */}
      {selectedUpgradeProfile && (
        <UnifiedUpgradesModal
          isOpen={upgradesModalOpen}
          onClose={() => {
            setUpgradesModalOpen(false);
            setSelectedUpgradeProfile(null);
            // Refrescar datos
            queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
          }}
          profile={selectedUpgradeProfile}
        />
      )}
    </div>
  );
}
