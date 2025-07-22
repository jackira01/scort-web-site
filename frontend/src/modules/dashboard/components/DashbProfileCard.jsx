import {
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Shield,
  Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
export const DashboardProfileCard = () => {
  return (
    <Card
      key={profile.id}
      className="group hover:shadow-xl transition-all duration-500 overflow-hidden bg-card border-border hover:border-purple-500/50 animate-in zoom-in-50"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-purple-500/20 group-hover:border-purple-500/50 transition-all duration-300">
              <AvatarImage
                src={profile.image || '/placeholder.svg'}
                alt={profile.name}
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-lg font-semibold">
                {profile.name
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
                {profile.name}
              </h3>
              <Badge
                variant={profile.status === 'Activo' ? 'default' : 'secondary'}
                className={
                  profile.status === 'Activo'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                    : ''
                }
              >
                {profile.status}
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {profile.age} años
              </span>
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {profile.location}
              </span>
              <Badge variant="outline" className="text-xs">
                {profile.category}
              </Badge>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center text-muted-foreground">
                <Eye className="h-3 w-3 mr-1" />
                {profile.views} vistas
              </span>
              <span className="flex items-center text-muted-foreground">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {profile.rating}
              </span>
              {profile.verified && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <div className="flex space-x-2 flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500 transition-all duration-200"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Estadísticas
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500 transition-all duration-200"
            >
              <Bell className="h-3 w-3 mr-1" />
              Actualizaciones
            </Button>
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
