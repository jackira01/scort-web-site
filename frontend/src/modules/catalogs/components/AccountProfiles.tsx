import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Plus,
  Shield,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileResponse {
  _id: string;
  user: string;
  name: string;
  profileImage: string;
  location: {
    country: string;
    state: string;
    city: string;
  },
  age: string;
  verification: {
    _id: string;
    verificationStatus: string;
    verificationProgress: number;
  }
}

interface ProfileListProps {
  profiles: ProfileResponse[];
  getProgressColor: (percentage: number) => string;
  getProgressTextColor: (percentage: number) => string;
}

const AccountProfiles = ({
  profiles,
  getProgressColor,
  getProgressTextColor,
}: ProfileListProps) => {
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
            Crea tu primer perfil para comenzar a conectar con personas increíbles
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
                  src={profile.profileImage || '/placeholder.svg'}
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
                      profile.verification?.verificationStatus === 'Activo' ? 'default' : 'secondary'
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
                        {profile.location?.department && profile.location?.city && `${profile.location.department}, ${profile.location.city}`}
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
                        style={{ width: `${profile.verification?.verificationProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 pt-2">
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
                    <Link href={`/cuenta/verificar-perfil/${profile._id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500 transition-all duration-200"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Verificar Perfil
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountProfiles;
