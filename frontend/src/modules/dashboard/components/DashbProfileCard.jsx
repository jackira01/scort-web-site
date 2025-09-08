import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Shield,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { hardDeleteProfile } from '@/services/user.service';
import { toast } from 'sonner';
export const DashbProfileCard = ({
  profile,
  index,
  setSelectedProfileForVerification,
  setVerificationCarouselOpen,
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
      console.error('Error al eliminar perfil:', error);
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

        <div className="flex items-center justify-between">
          <div className="flex space-x-2 flex-wrap gap-1">
            <Link href={`/cuenta/editar-perfil/${profile._id}`}>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProfileForVerification(profile);
                setVerificationCarouselOpen(true);
              }}
              className="hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-500 transition-all duration-200"
            >
              <Shield className="h-3 w-3 mr-1" />
              Verificar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleHardDelete}
              disabled={isDeleting}
              className="hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500 transition-all duration-200 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
