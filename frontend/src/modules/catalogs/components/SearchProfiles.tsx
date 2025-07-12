import {
  Calendar,
  CheckCircle,
  Heart,
  MapPin,
  Star,
  User,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { profiles } from '@/modules/stories/data';

const SearchProfiles = ({ viewMode }: { viewMode: 'grid' | 'list' }) => {
  return (
    <div
      className={`grid gap-4 lg:gap-6 ${
        viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
          : 'grid-cols-1'
      }`}
    >
      {profiles.map((profile) => (
        <Card
          key={profile.id}
          className="group hover:shadow-xl transition-all duration-300 overflow-hidden bg-card border-border"
        >
          <div className="relative">
            <Image
              width={0}
              height={0}
              src={profile.image || '/placeholder.svg'}
              alt={profile.name}
              className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                viewMode === 'grid' ? 'h-48 sm:h-56 lg:h-64' : 'h-40 sm:h-48'
              }`}
            />
            {profile.featured && (
              <Badge className="absolute top-2 lg:top-3 left-2 lg:left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                <Star className="h-2 w-2 lg:h-3 lg:w-3 mr-1" />
                PRESENTADO
              </Badge>
            )}
            <div className="absolute top-2 lg:top-3 right-2 lg:right-3 flex space-x-1 lg:space-x-2">
              {profile.verified && (
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
            <Button
              size="sm"
              variant="ghost"
              className="absolute bottom-2 lg:bottom-3 right-2 lg:right-3 bg-background/90 hover:bg-background p-2 backdrop-blur"
            >
              <Heart className="h-3 w-3 lg:h-4 lg:w-4" />
            </Button>
          </div>
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-base lg:text-lg text-foreground group-hover:text-purple-600 transition-colors">
                  {profile.name}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs lg:text-sm text-muted-foreground mt-1">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Edad {profile.age}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profile.location}
                  </span>
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {profile.height}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-xs lg:text-sm mb-4 line-clamp-2 lg:line-clamp-3">
              {profile.description}
            </p>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm">
              Ver perfil
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SearchProfiles;
