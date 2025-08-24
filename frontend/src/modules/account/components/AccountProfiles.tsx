import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Plus,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import UploadStoryModal from './UploadStoryModal';
import DeleteProfileModal from './DeleteProfileModal';
import { deleteProfile } from '@/services/user.service';

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

  

  const handleDeleteStory = async (profileId: string, storyIndex: number) => {
    try {
      // Encontrar el perfil en el estado local
      const profileToUpdate = profiles.find((p) => p._id === profileId);
      if (!profileToUpdate) return;

      // Obtener el perfil completo para preservar todos los datos de media
      const { updateProfile, getProfileById } = await import(
        '@/services/user.service'
      );
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
      
      // Recargar la página para mostrar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.dismiss();
      toast.error('Error al eliminar el perfil');
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile, index) => (
            <Card
              key={profile._id}
              className="group hover:shadow-xl transition-all duration-500 overflow-hidden bg-card border-border hover:border-purple-500/50 animate-in zoom-in-50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                <Image
                  width={400}
                  height={200}
                  src={profile.media?.gallery?.[0] || '/placeholder.svg'}
                  alt={profile.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 left-3 flex space-x-2">
                  {/* {profile.featured && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse">
                      <Star className="h-3 w-3 mr-1" />
                      DESTACADO
                    </Badge>
                  )} */}
                </div>
                <div className="absolute top-3 right-3 flex space-x-2">
                  {profile.verification?.verificationStatus === 'Activo' && (
                    <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                      <CheckCircle className="h-3 w-3" />
                    </Badge>
                  )}
                  <Badge
                    variant={
                      profile.verification?.verificationStatus === 'Activo'
                        ? 'default'
                        : 'secondary'
                    }
                    className={
                      profile.verification?.verificationStatus === 'Activo'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                        : ''
                    }
                  >
                    {profile.verification?.verificationStatus}
                  </Badge>
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

                  <div className="space-y-2 pt-2">
                    {/* Primera fila de botones */}
                    <div className="flex space-x-2">
                      <Link href={`/cuenta/editar-perfil/${profile._id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/cuenta/verificar-perfil/${profile._id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500 transition-all duration-200"
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Verificar
                        </Button>
                      </Link>
                    </div>
                    {/* Segunda fila de botones */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProfileForStory(profile);
                          setUploadStoryModalOpen(true);
                        }}
                        className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 transition-all duration-200"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Historia
                      </Button>
                      <Link href={`/perfil/${profile._id}`}>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </Link>
                    </div>
                    {/* Tercera fila - Botón de eliminar */}
                    <div className="flex">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteModal(profile)}
                        className="w-full hover:bg-red-600 transition-all duration-200"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar Perfil
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
    </div>
  );
};
