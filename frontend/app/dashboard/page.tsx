"use client";

import {
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  Edit,
  Eye,
  MapPin,
  MessageCircle,
  Plus,
  Receipt,
  Settings,
  Shield,
  Star,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProfileVerificationCarousel from "@/components/ProfileVerificationCarousel";

const sidebarItems = [
  {
    id: "perfil",
    label: "Mi Perfil",
    icon: User,
    badge: "4",
    description:
      "Aquí puede ver, administrar y actualizar su perfiles existente.",
    active: true,
  },
  /* {
    id: 'mensajes',
    label: 'Mensajes',
    icon: MessageCircle,
    badge: '12',
    description:
      'Aquí puedes chatear con otros usuarios usando nuestro sistema de mensajes privados.',
    active: false,
  }, */
  {
    id: "facturas",
    label: "Saldo y Facturas",
    icon: Receipt,
    badge: null,
    description:
      "Vea el saldo de su cuenta, las facturas y los retiros recientes aquí.",
    active: false,
  },
  {
    id: "ajustes",
    label: "Ajustes",
    icon: Settings,
    badge: null,
    description:
      "Los detalles de contacto, correo electrónico, contraseña y otros detalles de la cuenta se pueden encontrar aquí.",
    active: false,
  },
];

const userProfiles = [
  {
    id: 1,
    name: "Jane Ximena",
    age: 23,
    category: "ESCORT",
    location: "Bogotá",
    image: "/placeholder.svg?height=120&width=120",
    views: "5.1k",
    rating: 4.9,
    status: "Activo",
    verified: true,
    featured: true,
    verificationImages: [
      {
        id: 1,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Foto de perfil principal",
      },
      {
        id: 2,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Documento de identidad",
      },
      {
        id: 3,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Foto adicional de verificación",
      },
    ],
  },
  {
    id: 2,
    name: "Sofia Martinez",
    age: 25,
    category: "ESCORT",
    location: "Medellín",
    image: "/placeholder.svg?height=120&width=120",
    views: "3.8k",
    rating: 4.7,
    status: "Activo",
    verified: true,
    featured: false,
    verificationImages: [
      {
        id: 4,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Foto de perfil principal",
      },
      {
        id: 5,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Documento de identidad",
      },
    ],
  },
  {
    id: 3,
    name: "Isabella Rodriguez",
    age: 24,
    category: "VIRTUAL",
    location: "Cali",
    image: "/placeholder.svg?height=120&width=120",
    views: "2.9k",
    rating: 4.8,
    status: "Pausado",
    verified: true,
    featured: true,
    verificationImages: [
      {
        id: 6,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Foto de perfil principal",
      },
      {
        id: 7,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Documento de identidad",
      },
      {
        id: 8,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Selfie de verificación",
      },
      {
        id: 9,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Foto adicional",
      },
    ],
  },
  {
    id: 4,
    name: "Camila Torres",
    age: 26,
    category: "ESCORT",
    location: "Cartagena",
    image: "/placeholder.svg?height=120&width=120",
    views: "4.2k",
    rating: 4.6,
    status: "Activo",
    verified: false,
    featured: false,
    verificationImages: [
      {
        id: 10,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Foto de perfil principal",
      },
      {
        id: 11,
        url: "/placeholder.svg?height=400&width=300",
        alt: "Documento de identidad pendiente",
      },
    ],
  },
];

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("perfil");
  const [verificationCarouselOpen, setVerificationCarouselOpen] =
    useState(false);
  const [selectedProfileForVerification, setSelectedProfileForVerification] =
    useState<(typeof userProfiles)[0] | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case "perfil":
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Mi Perfil
              </h1>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Perfil
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userProfiles.map((profile, index) => (
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
                            src={profile.image || "/placeholder.svg"}
                            alt={profile.name}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-lg font-semibold">
                            {profile.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
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
                            variant={
                              profile.status === "Activo"
                                ? "default"
                                : "secondary"
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
              ))}
            </div>
          </div>
        );

      /* case 'mensajes':
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mensajes
            </h1>
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Sistema de Mensajes
                </h3>
                <p className="text-muted-foreground mb-4">
                  Aquí puedes chatear con otros usuarios usando nuestro sistema
                  de mensajes privados.
                </p>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Abrir Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        ); */

      case "facturas":
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Saldo y Facturas
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Saldo Actual</h3>
                  <p className="text-3xl font-bold">$2,450.00</p>
                  <p className="text-sm opacity-90 mt-1">
                    Disponible para retiro
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Este Mes</h3>
                  <p className="text-3xl font-bold">$890.00</p>
                  <p className="text-sm opacity-90 mt-1">Ingresos generados</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">Total</h3>
                  <p className="text-3xl font-bold">$12,340.00</p>
                  <p className="text-sm opacity-90 mt-1">Ingresos totales</p>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Facturas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          Factura #{String(item).padStart(4, "0")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Servicios de plataforma - Diciembre 2024
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">$125.00</p>
                        <Badge variant="outline" className="text-xs">
                          Pagado
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "ajustes":
        return (
          <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ajustes
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nombre completo
                    </label>
                    <p className="text-foreground">Nicolas Alvarez</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-foreground">nicolas@example.com</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Teléfono
                    </label>
                    <p className="text-foreground">+57 300 123 4567</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
                  >
                    Editar Información
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Seguridad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">
                      Autenticación de dos factores
                    </span>
                    <Badge variant="outline" className="text-green-600">
                      Activo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Última sesión</span>
                    <span className="text-muted-foreground text-sm">
                      Hace 2 horas
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500 transition-all duration-200"
                  >
                    Cambiar Contraseña
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      {/* Header */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80 space-y-2 animate-in slide-in-from-left-4 duration-500">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <nav className="space-y-2">
                  {sidebarItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group animate-in slide-in-from-left-2 ${
                        activeSection === item.id
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <item.icon
                        className={`h-5 w-5 ${activeSection === item.id ? "text-white" : "group-hover:text-purple-600"} transition-colors duration-200`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant={
                                activeSection === item.id
                                  ? "secondary"
                                  : "default"
                              }
                              className={`text-xs ${
                                activeSection === item.id
                                  ? "bg-white/20 text-white"
                                  : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100"
                              }`}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-1 ${
                            activeSection === item.id
                              ? "text-white/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg hover:scale-105 transition-transform duration-200">
          🟢 NICOLAS ALVAREZ
        </Badge>
      </div>

      {/* Profile Verification Carousel */}
      {selectedProfileForVerification && (
        <ProfileVerificationCarousel
          isOpen={verificationCarouselOpen}
          onOpenChange={setVerificationCarouselOpen}
          profileName={selectedProfileForVerification.name}
          images={selectedProfileForVerification.verificationImages || []}
          onVerifyProfile={() => {
            // Aquí puedes agregar la lógica para verificar el perfil
            console.log(
              `Verificando perfil de ${selectedProfileForVerification.name}`,
            );
            setVerificationCarouselOpen(false);
            setSelectedProfileForVerification(null);
            // Podrías mostrar un toast de éxito aquí
          }}
        />
      )}
    </div>
  );
}
