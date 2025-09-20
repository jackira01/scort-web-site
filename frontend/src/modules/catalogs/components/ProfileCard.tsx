import {
  Calendar,
  CheckCircle,
  MapPin,
  Star,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationBar } from '@/components/VerificationBar/VerificationBar';
import type { Profile } from '@/types/user.types';
import type { ProfileCardData, LocationValue } from '@/types/profile.types';
import {
  formatLocation,
  hasDestacadoUpgrade,
} from '@/utils/profile.utils';

interface ProfileCardProps {
  profile: ProfileCardData;
  viewMode?: 'grid' | 'list';
  variant?: 'default' | 'featured' | 'compact';
}

export function ProfileCard({ profile, viewMode, variant = 'default' }: ProfileCardProps) {
  // Variante para destacados: solo imagen rectangular
  if (variant === 'featured') {
    return (
      <Link href={`/perfil/${profile._id}`} className="block">
        <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer relative">
          <div className="relative aspect-[4/3]">
            <Image
              src={profile.media?.gallery?.[0] || '/placeholder.svg'}
              alt={profile.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />



            {/* Overlay con información en hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end">
              <div className="p-3 text-white">
                <h3 className="font-semibold text-sm mb-1">
                  {profile.name}
                </h3>
                {profile.location?.city && (
                  <p className="text-xs text-white/90">
                    {typeof profile.location.city === 'object' && profile.location.city !== null && 'label' in profile.location.city 
                      ? (profile.location.city as LocationValue).label 
                      : typeof profile.location.city === 'object' && profile.location.city !== null 
                        ? JSON.stringify(profile.location.city)
                        : profile.location.city || 'Ciudad no especificada'
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Variante por defecto: card completa con información responsive
  return (
    <Link href={`/perfil/${profile._id}`} className="block">
      <Card className={`group hover:shadow-xl transition-all duration-300 overflow-hidden relative ${
        profile.featured 
          ? 'bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-100 dark:from-yellow-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30'
          : 'bg-card border-border'
      }`}>
        {/* Layout responsive: horizontal en mobile, vertical en desktop */}
        <div className="flex flex-row sm:flex-col">
          {/* Imagen */}
          <div className="relative w-32 h-32 sm:w-full flex-shrink-0">
            <Image
              width={300}
              height={300}
              src={profile.media.gallery?.[0] || '/placeholder.svg'}
              alt={profile.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                viewMode === 'grid'
                  ? 'sm:h-48 md:h-56 lg:h-64'
                  : 'sm:h-40 md:h-48'
                }`}
            />
            {hasDestacadoUpgrade(profile as Profile) && (
              <Badge className="absolute top-1 left-1 sm:top-2 lg:top-3 sm:left-2 lg:left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                <Star className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                <span className="hidden sm:inline">PRESENTADO</span>
                <span className="sm:hidden">★</span>
              </Badge>
            )}
            <div className="absolute top-1 right-1 sm:top-2 lg:top-3 sm:right-2 lg:right-3 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 lg:space-x-2">
              {profile.verification?.isVerified && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 p-1"
                >
                  <CheckCircle className="h-2 w-2 lg:h-3 lg:w-3" />
                </Badge>
              )}
              {profile.online && (
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
              )}
              {profile.hasVideo && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 p-1"
                >
                  <Video className="h-2 w-2 lg:h-3 lg:w-3" />
                </Badge>
              )}
            </div>
          </div>

          {/* Contenido siempre visible */}
          <CardContent className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-foreground group-hover:text-purple-600 transition-colors line-clamp-1">
                  {profile.name}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs lg:text-sm text-muted-foreground mt-1 space-y-1 sm:space-y-0">
                  <span className="flex items-center">
                    <Calendar className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                    {profile.age} años
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                    <span className="line-clamp-1">
                      {formatLocation(profile.location)}
                    </span>
                  </span>
                </div>
                
                {/* Barra de verificación */}
                {profile.verification?.isVerified && (
                  <div className="mt-2">
                    <VerificationBar 
                      verification={profile.verification} 
                      size="sm" 
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Botón visible en mobile, oculto en desktop (aparece en hover) */}
            <div className="mt-2 sm:hidden">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs py-1">
                Ver perfil
              </Button>
            </div>
          </CardContent>
        </div>

        {/* Contenido que aparece en hover (solo en desktop) */}
        <div className="hidden sm:block absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col justify-end h-full">
            <div className="p-4 lg:p-6 text-white">
              <h3 className="font-semibold text-base lg:text-lg mb-2">
                {profile.name}
              </h3>
              <div className="flex flex-col space-y-1 text-xs lg:text-sm mb-3">
                <span className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Edad {profile.age}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Ciudad: {typeof profile.location?.city === 'object' ? profile.location?.city?.label : profile.location?.city || 'No disponible'}
                </span>
              </div>
              <p className="text-white/90 text-xs lg:text-sm mb-4 line-clamp-3">
                {profile.description}
              </p>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm">
                Ver perfil
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default ProfileCard;