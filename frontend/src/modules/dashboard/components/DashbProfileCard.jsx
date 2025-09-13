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
  const queryClient = useQueryClient();

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
    <Card
      className="group hover:shadow-xl transition-all duration-500 overflow-hidden bg-card border-border hover:border-purple-500/50 animate-in zoom-in-50"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300">
              <AvatarImage
                src={profile.media?.gallery?.[0] || '/placeholder.svg'}
                alt={profile.profileName || profile.name}
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-lg font-semibold">
                {(profile.profileName || profile.name || 'N/A')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            {profile.featured && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <Star className="h-3 w-3 text-white fill-white" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-purple-600 transition-colors duration-300">
                {profile.profileName || profile.name || 'Sin nombre'}
              </h3>
              <Badge
                variant={profile.isActive ? 'default' : 'secondary'}
                className={
                  profile.isActive
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                    : ''
                }
              >
                {profile.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {profile.age || 'N/A'} años
              </span>
              {/* <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {profile.location || 'Sin ubicación'}
              </span> */}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              {profile.isVerified && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-1 pt-2">
          {/* Primera fila de botones */}
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
            {/* Botones de Upgrade */}
            {/* Solo mostrar botón de Destacado si NO es plan DIAMANTE */}
            {profile.planAssignment?.planCode !== 'DIAMANTE' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={profile.hasDestacadoUpgrade ? "default" : "outline"}
                      className={`p-2 ${profile.hasDestacadoUpgrade
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                        : 'hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-500'
                        } transition-all duration-200`}
                      disabled={profile.hasDestacadoUpgrade}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{profile.hasDestacadoUpgrade ? 'Destacado Activo' : 'Destacado Disponible'}</p>
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
                    disabled={profile.hasImpulsoUpgrade}
                  >
                    <Zap className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{profile.hasImpulsoUpgrade ? 'Impulso Activo' : 'Impulso Disponible'}</p>
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
                    onClick={() => setManagePlansProfileId && setManagePlansProfileId(profile._id)}
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
  );
};
