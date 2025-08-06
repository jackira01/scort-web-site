import {
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  Plus,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProfileVerificationCarousel from "@/modules/dashboard/components/ProfileVerificationCarousel";

interface VerificationImage {
  id: number;
  url: string;
  alt: string;
}

interface Profile {
  id: number;
  name: string;
  age: number;
  category: string;
  location: string;
  image: string;
  views: string;
  rating: number;
  status: string;
  verified: boolean;
  featured: boolean;
  completeness: number;
  verificationImages?: VerificationImage[];
}

interface ProfileListProps {
  profiles: Profile[];
  getProgressColor: (percentage: number) => string;
  getProgressTextColor: (percentage: number) => string;
}

export default function ProfileList({
  profiles,
  getProgressColor,
  getProgressTextColor,
}: ProfileListProps) {
  const [verificationCarouselOpen, setVerificationCarouselOpen] =
    useState(false);
  const [selectedProfileForVerification, setSelectedProfileForVerification] =
    useState<Profile | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Mis Perfiles
        </h1>
        <div className="gap-2 flex items-center">
          <Button className="bg-gradient-to-r from-blue-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
            <Zap className="h-4 w-4 mr-2" />
            Impulsarme
          </Button>

          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Perfil
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile, index) => (
          <Card
            key={profile.id}
            className="group hover:shadow-xl transition-all duration-500 overflow-hidden bg-card border-border hover:border-purple-500/50 animate-in zoom-in-50"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative">
              <Image
                width={400}
                height={200}
                src={profile.image || "/placeholder.svg"}
                alt={profile.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-3 left-3 flex space-x-2">
                {profile.featured && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse">
                    <Star className="h-3 w-3 mr-1" />
                    DESTACADO
                  </Badge>
                )}
              </div>
              <div className="absolute top-3 right-3 flex space-x-2">
                {profile.verified && (
                  <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                    <CheckCircle className="h-3 w-3" />
                  </Badge>
                )}
                <Badge
                  variant={
                    profile.status === "Activo" ? "default" : "secondary"
                  }
                  className={
                    profile.status === "Activo"
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                      : ""
                  }
                >
                  {profile.status}
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
                      {profile.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  {/*  <Badge variant="outline" className="text-xs">
                    {profile.category}
                  </Badge> */}
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center text-muted-foreground">
                      <Eye className="h-3 w-3 mr-1" />
                      {profile.views}
                    </span>
                    <span className="flex items-center text-muted-foreground">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {profile.rating}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Completitud del perfil
                    </span>
                    <span
                      className={`font-medium ${getProgressTextColor(profile.completeness)}`}
                    >
                      {profile.completeness}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(profile.completeness)}`}
                      style={{ width: `${profile.completeness}%` }}
                    />
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedProfileForVerification(profile);
                      setVerificationCarouselOpen(true);
                    }}
                    className="flex-1 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-500 transition-all duration-200"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Verificar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Verification Carousel */}
      {selectedProfileForVerification && (
        <ProfileVerificationCarousel
          isOpen={verificationCarouselOpen}
          onOpenChange={setVerificationCarouselOpen}
          profileName={selectedProfileForVerification.name}
          images={selectedProfileForVerification.verificationImages || []}
          onVerifyProfile={() => {
            console.log(
              `Verificando perfil de ${selectedProfileForVerification.name}`,
            );
            setVerificationCarouselOpen(false);
            setSelectedProfileForVerification(null);
          }}
        />
      )}
    </div>
  );
}
