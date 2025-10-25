import { Calendar, CheckCircle, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationBar } from '@/components/VerificationBar/VerificationBar';
import type { ProfileCardData } from '@/types/profile.types';

interface CardComponentProps {
  profiles?: ProfileCardData[];
}

const CardComponent = ({ profiles = [] }: CardComponentProps) => {
  // Si no hay perfiles, mostrar mensaje
  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-300">No hay perfiles disponibles</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {profiles.map((profile, index) => (
        <Link href={`/perfil/${profile._id}`} key={profile._id}>
          <Card
            className={`group hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer md:w-60 lg:w-64  ${profile.hasDestacadoUpgrade
              ? 'bg-gradient-to-br from-yellow-100 via-orange-50 to-yellow-100 dark:from-yellow-900/30 dark:via-orange-900/20 dark:to-yellow-900/30 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50'
              : 'bg-card border-border hover:border-purple-500/50'
              }`}
            style={{ animationDelay: `${index * 200}ms` }}
          >
            {/* Layout responsive: horizontal en mobile, vertical en desktop */}
            <div className="flex flex-row sm:flex-col">
              {/* Imagen */}
              <div className="relative overflow-hidden w-32 h-full md:w-full flex-shrink-0">
                <Image
                  width={400}
                  height={300}
                  src={profile.media?.gallery?.[0] || '/placeholder.svg'}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                  {profile.hasDestacadoUpgrade && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse text-xs">
                      <Star className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      <span className="hidden sm:inline">DESTACADO</span>
                      <span className="sm:hidden">★</span>
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                  {profile.verification?.isVerified && (
                    <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:scale-110 transition-transform duration-200 text-xs">
                      <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3" />
                    </Badge>
                  )}
                  {profile.online && (
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Contenido */}
              <CardContent className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <h3 className="font-semibold text-sm sm:text-lg text-foreground group-hover:text-purple-600 transition-colors duration-300 line-clamp-1">
                    {profile.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-0">
                    <span className="flex items-center hover:text-foreground transition-colors duration-200">
                      <Calendar className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      {profile.age || 'N/A'} años
                    </span>
                    <span className="flex items-center hover:text-foreground transition-colors duration-200">
                      <MapPin className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                      <span className="line-clamp-1">
                        {(typeof profile.location?.city === 'object' ? profile.location.city.label : profile.location?.city) ||
                          (typeof profile.location?.department === 'object' ? profile.location.department.label : profile.location?.department) ||
                          'Ubicación no disponible'}
                      </span>
                    </span>
                  </div>

                  <p className="clamp-description text-xs sm:text-sm text-muted-foreground mt-2">
                    {profile.description}
                  </p>


                  {/* Barra de verificación */}
                  <div className="mt-2">
                    <VerificationBar
                      verification={profile.verification}
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </div>
                {/* BOTÓN MODIFICADO */}
                {/* <Button
                  // Nueva variante: 'outline' para ser menos llamativo que el 'default'
                  variant="outline"
                  // Nuevo tamaño: 'sm' para reducir el padding vertical y el tamaño de fuente
                  size="sm"
                  // CLASES ACTUALIZADAS: Se eliminó 'w-full' para reducir el ancho
                  className={`mt-2 sm:mt-3 
                    // Se usan clases de texto más discretas y se elimina el efecto 'Destacado' en el botón para hacerlo menos llamativo
                    text-xs transition-colors duration-300 hover:bg-muted/50
                  `}
                  onClick={(e) => e.preventDefault()} // Prevenir doble navegación
                >
                  Ver perfil
                </Button> */}
                {/* FIN DEL BOTÓN MODIFICADO */}
              </CardContent>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default CardComponent;