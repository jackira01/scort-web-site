"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Heart,
  Share2,
  MessageCircle,
  Phone,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  DollarSign,
  CheckCircle,
  Star,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import HeaderComponent from "@/components/Header/Header"

// Mock data for the profile
const profileData = {
  id: "1",
  name: "Jane Ximena",
  age: 23,
  location: "Colombia, Huila",
  category: "ESCORT",
  verified: true,
  online: true,
  rating: 4.9,
  reviews: 127,
  images: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=400",
    "/placeholder.svg?height=400&width=400",
  ],
  description:
    "Hola, soy Jane, una acompañante profesional y elegante. Me caracterizo por mi personalidad carismática y mi dedicación a brindar momentos únicos e inolvidables. Disfruto de las conversaciones interesantes, las cenas elegantes y los eventos sociales. Mi objetivo es hacer que cada encuentro sea especial y memorable.",
  services: [
    "Acompañamiento a eventos sociales",
    "Cenas románticas",
    "Compañía para viajes",
    "Conversaciones intelectuales",
    "Masajes relajantes",
    "Experiencias personalizadas",
  ],
  physicalTraits: {
    edad: "23",
    piel: "Blanca",
    genero: "Mujer",
    ubicacion: "Colombia, Huila",
    ojos: "Negros",
    pelo: "Negro",
    cuerpo: "Curvy",
    altura: "173 cm",
    busto: "COPA_D",
  },
  socialMedia: {
    whatsapp: "+57 300 123 4567",
    telegram: "@janeximena",
    instagram: "@jane.ximena",
    twitter: "@janeximena",
    facebook: "jane.ximena",
  },
  rates: [
    { duration: "1 hora", price: 200, currency: "USD" },
    { duration: "2 horas", price: 350, currency: "USD" },
    { duration: "Noche completa", price: 800, currency: "USD" },
    { duration: "Fin de semana", price: 1500, currency: "USD" },
  ],
  availability: {
    monday: "9:00 AM - 11:00 PM",
    tuesday: "9:00 AM - 11:00 PM",
    wednesday: "9:00 AM - 11:00 PM",
    thursday: "9:00 AM - 11:00 PM",
    friday: "24 horas",
    saturday: "24 horas",
    sunday: "2:00 PM - 10:00 PM",
  },
  videoUrl: "/placeholder-video.mp4",
}

export default function ProfileDetailPage({ params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleSocialClick = (platform: string, handle: string) => {
    const urls = {
      whatsapp: `https://wa.me/${handle.replace(/\s+/g, "")}`,
      telegram: `https://t.me/${handle.replace("@", "")}`,
      instagram: `https://instagram.com/${handle.replace("@", "")}`,
      twitter: `https://twitter.com/${handle.replace("@", "")}`,
      facebook: `https://facebook.com/${handle}`,
    }
    window.open(urls[platform as keyof typeof urls], "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      {/* Header */}
      <HeaderComponent />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Section - 80% */}
          <div className="lg:col-span-4 space-y-8">
            {/* Gallery Section */}
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-left-4 duration-500">
              {/* Main Image */}
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <img
                  src={profileData.images[selectedImage] || "/placeholder.svg"}
                  alt={`${profileData.name} - Imagen ${selectedImage + 1}`}
                  className="w-full h-96 lg:h-[500px] object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {profileData.verified && (
                  <Badge className="absolute top-4 left-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                <div className="absolute top-4 right-4 flex items-center space-x-1 bg-black/50 backdrop-blur rounded-full px-2 py-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-white text-sm font-medium">{profileData.rating}</span>
                  <span className="text-white/80 text-xs">({profileData.reviews})</span>
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {profileData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative overflow-hidden rounded-lg aspect-square group transition-all duration-200 ${
                      selectedImage === index
                        ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-background"
                        : "hover:ring-2 hover:ring-purple-300 hover:ring-offset-2 hover:ring-offset-background"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-200" />
                  </button>
                ))}
              </div>
            </div>

            {/* Description and Services */}
            <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-6 duration-700">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{profileData.description}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Servicios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profileData.services.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-foreground text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Section - 20% */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Header */}
            <div className="text-center animate-in fade-in-50 slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {profileData.name}
              </h2>
              <p className="text-muted-foreground">
                {profileData.age} años • {profileData.category}
              </p>
            </div>

            {/* Social Media Buttons */}
            <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-6 duration-700">
              <CardContent className="p-4 space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  onClick={() => handleSocialClick("whatsapp", profileData.socialMedia.whatsapp)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar mensaje
                </Button>
                <Button
                  variant="outline"
                  className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-500"
                  onClick={() => handleSocialClick("whatsapp", profileData.socialMedia.whatsapp)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {profileData.socialMedia.whatsapp.replace(/(\d{3})(\d{3})(\d{4})/, "$1 *** ****")}
                </Button>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleSocialClick("whatsapp", profileData.socialMedia.whatsapp)}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  WhatsApp Me!
                </Button>
              </CardContent>
            </Card>

            {/* Physical Traits */}
            <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-8 duration-900">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">¿Cómo me veo?</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {Object.entries(profileData.physicalTraits).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm capitalize">{key}</span>
                      <span className="text-foreground text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Video Player */}
            <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-10 duration-1000">
              <CardContent className="p-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
                  <img
                    src={profileData.images[1] || "/placeholder.svg"}
                    alt="Video preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30"
                      onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    >
                      {isVideoPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    </Button>
                  </div>
                  <div className="absolute bottom-2 right-2 flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-black/50 hover:bg-black/70 text-white"
                      onClick={() => setIsVideoMuted(!isVideoMuted)}
                    >
                      {isVideoMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rates */}
            <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-12 duration-1100">
              <CardHeader>
                <CardTitle className="text-foreground text-sm flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Tarifas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {profileData.rates.map((rate, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200"
                    >
                      <span className="text-foreground text-sm">{rate.duration}</span>
                      <span className="text-foreground font-semibold">
                        ${rate.price} {rate.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-14 duration-1200">
              <CardHeader>
                <CardTitle className="text-foreground text-sm flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {Object.entries(profileData.availability).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground capitalize">
                        {day === "monday"
                          ? "Lun"
                          : day === "tuesday"
                            ? "Mar"
                            : day === "wednesday"
                              ? "Mié"
                              : day === "thursday"
                                ? "Jue"
                                : day === "friday"
                                  ? "Vie"
                                  : day === "saturday"
                                    ? "Sáb"
                                    : "Dom"}
                      </span>
                      <span className="text-foreground font-medium">{hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
