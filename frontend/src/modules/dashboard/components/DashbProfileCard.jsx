import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Shield,
  Star,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { hardDeleteProfile } from '@/services/user.service';
import toast from 'react-hot-toast';
import { hasDestacadoUpgrade } from '@/utils/profile.utils';
import UpgradeModal from '@/components/upgrades/UpgradeModal';
export const DashbProfileCard = ({
  profile,
  index,
  setSelectedProfileForVerification,
  setVerificationCarouselOpen,
  setManagePlansProfileId,
  setSelectedProfileForStory,
  setUploadStoryModalOpen,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradeCode, setSelectedUpgradeCode] = useState(null);
  const queryClient = useQueryClient();

  const handleUpgradeClick = (upgradeCode) => {
    setSelectedUpgradeCode(upgradeCode);
    setUpgradeModalOpen(true);
  };

  const handleHardDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar permanentemente este perfil? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await hardDeleteProfile(profile._id);
      toast.success('Perfil eliminado permanentemente');
      
      // Invalidar las queries para actualizar la lista
      queryClient.invalidateQueries({ queryKey: ['adminProfiles'] });
    } catch (error) {
      toast.error('Error al eliminar el perfil');
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <>
    <Card
  className="group hover:shadow-xl transition-all duration-500 overflow-hidden bg-card border-border hover:border-purple-500/50"
  style={{ animationDelay: `${index * 150}ms` }}
>
  <CardContent className="p-6">
    <div className="flex items-start space-x-4">
      {/* Imagen rectangular */}
      <div className="relative">
        <div className="h-28 w-20 rounded-lg overflow-hidden border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300 bg-muted flex items-center justify-center">
          <img
            src={profile.media?.gallery?.[0] || '/placeholder.svg'}
            alt={profile.profileName || profile.name}
            className="object-contain w-full h-full"
          />
        </div>

        {/* Icono de destacado */}
        {hasDestacadoUpgrade(profile) && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <Star className="h-3 w-3 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Información */}
      <div className="flex-1 space-y-2">
        {/* Nombre + Badge debajo */}
        <div>
          <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-600 transition-colors duration-300">
            {profile.profileName || profile.name || 'Sin nombre'}
          </h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge
              variant={profile.isActive ? 'default' : 'secondary'}
              className={`${
                profile.isActive
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                  : ''
              }`}
            >
              {profile.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            {profile.isDeleted && (
              <Badge
                variant="destructive"
                className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
              >
                Eliminado
              </Badge>
            )}
          </div>
        </div>

        {/* Ícono de verificación */}
        {profile.isVerified && (
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-600 dark:text-green-400">Verificado</span>
          </div>
        )}
      </div>
    </div>

    <Separator className="my-4" />

    {/* Botones */}
    <div className="space-y-1 pt-2">
      {/* Primera fila */}
      <div className="flex space-x-1 justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedProfileForVerification(profile);
                  setVerificationCarouselOpen(true);
                }}
                className="p-2 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500 transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verificar perfil</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Botón destacado */}
        {profile.planAssignment?.planCode !== 'DIAMANTE' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={hasDestacadoUpgrade(profile) ? 'default' : 'outline'}
                  className={`p-2 ${
                    hasDestacadoUpgrade(profile)
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                      : 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-500'
                  } transition-all duration-200`}
                  onClick={() => handleUpgradeClick('DESTACADO')}
                  disabled={hasDestacadoUpgrade(profile)}
                >
                  <Star className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {hasDestacadoUpgrade(profile)
                    ? 'Destacado Activo'
                    : 'Destacado Disponible'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Botón impulso */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={profile.hasImpulsoUpgrade ? 'default' : 'outline'}
                className={`p-2 ${
                  profile.hasImpulsoUpgrade
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    : 'hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500'
                } transition-all duration-200`}
                onClick={() => handleUpgradeClick('IMPULSO')}
                disabled={profile.hasImpulsoUpgrade}
              >
                <Zap className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {profile.hasImpulsoUpgrade
                  ? 'Impulso Activo'
                  : 'Impulso Disponible'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Segunda fila */}
      <div className="flex space-x-1 justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setManagePlansProfileId && setManagePlansProfileId(profile._id)
                }
                className="p-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
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
                  if (setSelectedProfileForStory && setUploadStoryModalOpen) {
                    setSelectedProfileForStory(profile);
                    setUploadStoryModalOpen(true);
                  }
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
              <Button
                size="sm"
                variant="destructive"
                onClick={handleHardDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-red-600 transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDeleting ? 'Eliminando...' : 'Eliminar perfil'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  </CardContent>
</Card>

    {/* Upgrade Modal */}
    {selectedUpgradeCode && (
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => {
          setUpgradeModalOpen(false);
          setSelectedUpgradeCode(null);
        }}
        profileId={profile._id}
        profile={profile}
        upgradeCode={selectedUpgradeCode}
      />
    )}
  </>
  );
};
