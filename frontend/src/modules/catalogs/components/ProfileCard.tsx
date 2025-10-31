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
          <div className="relative h-72 w-full">
            <Image
              src={profile.media?.gallery?.[0] || '/placeholder.svg'}
              alt={profile.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Badges siempre visibles */}
            <div className="absolute top-3 right-3 flex space-x-2 z-10">
              {profile.verification?.isVerified && (
                <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                  <CheckCircle className="h-3 w-3" />
                </Badge>
              )}
              {profile.hasDestacadoUpgrade && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <Star className="h-3 w-3" />
                </Badge>
              )}
            </div>

            {/* Overlay con información con pulso */}
            <div className="pulse-content absolute inset-0 flex flex-col justify-end pointer-events-none group-hover:pointer-events-auto z-10">
              <div className="p-4 bg-black/70 backdrop-blur-sm">
                <h3 className="font-semibold text-base text-white mb-1">
                  {profile.name}
                </h3>
                {profile.location?.city && (
                  <p className="text-sm text-white/90 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {typeof profile.location.city === 'object' && profile.location.city !== null && 'label' in profile.location.city
                      ? (profile.location.city as LocationValue).label
                      : typeof profile.location.city === 'object' && profile.location.city !== null
                        ? JSON.stringify(profile.location.city)
                        : profile.location.city || 'Ciudad no especificada'
                    }
                  </p>
                )}
                {profile.description && (
                  <p className="text-xs text-white/80 mt-2 line-clamp-3">
                    {profile.description}
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
      <Card className={`group hover:shadow-xl transition-all duration-300 overflow-hidden relative ${profile.hasDestacadoUpgrade
        ? 'bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-100 dark:from-yellow-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30'
        : 'bg-card border-border'
        }`}>
        {/* Layout responsive: horizontal en mobile, vertical en desktop */}
        <div className="flex flex-row sm:flex-col h-full w-full">
          {/* Imagen */}
          <div className="relative w-32 h-44 sm:w-full sm:h-56 md:h-96 lg:h-96 flex-shrink-0">
            <Image
              width={300}
              height={400}
              src={profile.media.gallery?.[0] || '/placeholder.svg'}
              alt={profile.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:from-black/60" />

            {/* Badges siempre visibles */}
            <div className="absolute top-1 right-1 sm:top-2 lg:top-3 sm:right-2 lg:right-3 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 lg:space-x-2 z-10">
              {profile.verification?.isVerified && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 p-1"
                >
                  <CheckCircle className="h-2 w-2 lg:h-3 lg:w-3" />
                </Badge>
              )}
              {profile.online && (
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full border border-white dark:border-gray-800 animate-pulse"></div>
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

            {/* Badge de Destacado */}
            {profile.hasDestacadoUpgrade && (
              <div className="absolute top-1 left-1 sm:top-3 sm:left-3 z-10">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                  <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">DESTACADO</span>
                </Badge>
              </div>
            )}

            {/* Contenido con animación de pulso - SOLO VISIBLE EN DESKTOP (sm y arriba) */}
            <div className="hidden sm:flex pulse-content absolute inset-0 p-4 lg:p-6 flex-col justify-end pointer-events-none group-hover:pointer-events-auto z-10">
              <div className="space-y-2 bg-black/70 backdrop-blur-sm rounded-lg p-3 lg:p-4">
                <h3 className="font-semibold text-base lg:text-lg text-white">
                  {profile.name}
                </h3>

                <div className="flex flex-col space-y-1 text-xs lg:text-sm text-white/90">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {profile.age} años
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {formatLocation(profile.location)}
                    </span>
                  </span>
                </div>

                {profile.description && (
                  <p className="text-xs lg:text-sm text-white/80 line-clamp-3 mt-2">
                    {profile.description}
                  </p>
                )}

                {/* Barra de verificación */}
                {profile.verification && (
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
          </div>

          {/* Contenido lateral en MOBILE (siempre visible) */}
          <CardContent className="p-3 sm:hidden lg:p-6 flex-1 flex flex-col justify-between">
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

                {profile.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                    {profile.description}
                  </p>
                )}

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

            {/* Botón visible en mobile */}
            <div className="mt-2">
              <Button
                className={`w-full text-white text-xs py-1 ${profile.hasDestacadoUpgrade
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                  }`}
              >
                Ver perfil
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

export default ProfileCard;