import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UnifiedUpgradesModal from '@/components/upgrades/UnifiedUpgradesModal';
import { hardDeleteProfile } from '@/services/user.service';
import { hasDestacadoUpgrade, hasImpulsoUpgrade } from '@/utils/profile.utils';
import { useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle,
    DollarSign,
    Edit,
    Eye,
    Rocket,
    Shield,
    Star,
    Trash2,
    Upload
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';

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
  const queryClient = useQueryClient();

  const handleUpgradesClick = () => {
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
    {/* Layout imagen + badges + nombre */}
<div className="flex space-x-4">

  {/* Imagen */}
  <div className="relative">
    <div className="h-28 w-20 rounded-lg overflow-hidden border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300 bg-muted flex items-center justify-center">
      <img
        src={profile.media?.gallery?.[0] || '/placeholder.svg'}
        alt={profile.profileName || profile.name}
        className="object-cover w-full h-full"
      />
    </div>

    {/* Icono destacado */}
    {hasDestacadoUpgrade(profile) && (
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
        <Star className="h-3 w-3 text-white fill-white" />
      </div>
    )}
  </div>

  {/* BADGES a la derecha verticalmente */}
  <div className="flex flex-col space-y-2">

    {!profile.isDeleted && (
      <Badge
        variant={profile.isActive ? "default" : "secondary"}
        className={`w-fit ${
          profile.isActive
            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
            : ""
        }`}
      >
        {profile.isActive ? "Activo" : "Inactivo"}
      </Badge>
    )}

    {profile.isDeleted && (
      <Badge
        variant="destructive"
        className="w-fit bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
      >
        Eliminado
      </Badge>
    )}

    {/* Verificado */}
    {profile.isVerified && (
      <div className="flex items-center space-x-1 text-sm">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-green-600 dark:text-green-400">Verificado</span>
      </div>
    )}

    {/* Pendiente de Verificación */}
    {profile.verification?.verificationStatus === 'pending' && (
       <Badge className="w-fit bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100">
         Pendiente
       </Badge>
    )}

  </div>
</div>

{/* NOMBRE centrado */}
<h3 className="text-center font-semibold text-lg mt-4 group-hover:text-purple-600 transition-colors duration-300">
  {profile.profileName || profile.name || "Sin nombre"}
</h3>

<Separator className="my-4" />


    <Separator className="my-4" />

    {/* Botones */}
<div className="pt-2">
  <div className="grid grid-cols-4 grid-rows-2 gap-1 justify-items-center">


    {/* Verificar */}
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

    {/* Upgrades */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={(hasDestacadoUpgrade(profile) || hasImpulsoUpgrade(profile)) ? 'default' : 'outline'}
            className={`p-2 ${
              (hasDestacadoUpgrade(profile) || hasImpulsoUpgrade(profile))
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white'
                : 'hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500'
            } transition-all duration-200`}
            onClick={handleUpgradesClick}
          >
            <Rocket className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Gestionar Upgrades</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    {/* Planes */}
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
            <DollarSign className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Administrar planes</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    {/* Ver */}
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

    {/* Editar */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/cuenta/editar-perfil/${profile._id}?returnUrl=${encodeURIComponent('/adminboard?section=perfiles')}`}>
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

    {/* Historia */}
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

    {/* Eliminar */}
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
    <UnifiedUpgradesModal
      isOpen={upgradeModalOpen}
      onClose={() => setUpgradeModalOpen(false)}
      profile={profile}
    />
  </>
  );
};
