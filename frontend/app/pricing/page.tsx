'use client';

import {
  ArrowRight,
  Check,
  Crown,
  Eye,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const plans = [
  {
    id: 'basico',
    name: 'Básico',
    description: 'Perfecto para empezar',
    icon: Users,
    price: { monthly: 50000, yearly: 500000 },
    popular: false,
    features: [
      'Perfil básico',
      'Hasta 5 fotos',
      'Descripción estándar',
      'Contacto básico',
      'Soporte por email',
      'Estadísticas básicas',
    ],
    limitations: ['Sin verificación', 'Sin destacar', 'Sin videos'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'El más popular',
    icon: Star,
    price: { monthly: 150000, yearly: 1500000 },
    popular: true,
    features: [
      'Todo lo del plan Básico',
      'Hasta 15 fotos',
      '2 videos incluidos',
      'Perfil verificado',
      'Destacar perfil',
      'Estadísticas avanzadas',
      'Soporte prioritario',
      'Chat en tiempo real',
      'Galería multimedia',
    ],
    limitations: [],
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Máxima visibilidad',
    icon: Crown,
    price: { monthly: 300000, yearly: 3000000 },
    popular: false,
    features: [
      'Todo lo del plan Premium',
      'Fotos ilimitadas',
      'Videos ilimitados',
      'Perfil en página principal',
      'Impulso semanal gratuito',
      'Soporte 24/7',
      'Manager personal',
      'Análisis detallados',
      'Promoción en redes sociales',
      'Sesión fotográfica gratuita',
    ],
    limitations: [],
  },
];

const addOns = [
  {
    id: 'boost',
    name: 'Impulso 24h',
    description: 'Aparece en los primeros resultados durante 24 horas',
    icon: Zap,
    price: 25000,
    duration: '24 horas',
  },
  {
    id: 'featured',
    name: 'Perfil Destacado',
    description: 'Tu perfil aparece con una insignia especial',
    icon: Sparkles,
    price: 75000,
    duration: '30 días',
  },
  {
    id: 'homepage',
    name: 'Página Principal',
    description: 'Aparece en la página de inicio del sitio',
    icon: Eye,
    price: 150000,
    duration: '7 días',
  },
  {
    id: 'verification',
    name: 'Verificación Express',
    description: 'Verificación prioritaria en 24 horas',
    icon: Shield,
    price: 50000,
    duration: 'Una vez',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200 cursor-pointer">
                  Online Escorts
                </h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="hover:bg-muted/50 transition-colors duration-200"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/create-profile">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Crear Perfil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tarifas y Planes
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Elige el plan perfecto para tu perfil. Aumenta tu visibilidad y
            conecta con más clientes.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label
              htmlFor="billing-toggle"
              className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Mensual
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label
              htmlFor="billing-toggle"
              className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Anual
            </Label>
            {isYearly && (
              <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100">
                Ahorra 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-500 hover:shadow-2xl animate-in zoom-in-50 ${
                plan.popular
                  ? 'border-purple-500 shadow-lg shadow-purple-500/25 scale-105'
                  : 'hover:border-purple-300'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 text-sm font-semibold">
                  Más Popular
                </div>
              )}

              <CardHeader
                className={`text-center ${plan.popular ? 'pt-12' : 'pt-6'}`}
              >
                <div className="flex justify-center mb-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                        : 'bg-muted'
                    }`}
                  >
                    <plan.icon
                      className={`h-8 w-8 ${plan.popular ? 'text-white' : 'text-muted-foreground'}`}
                    />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <p className="text-muted-foreground">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">
                    {formatPrice(
                      isYearly ? plan.price.yearly : plan.price.monthly,
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    /{isYearly ? 'año' : 'mes'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-center space-x-3"
                    >
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <div
                      key={limitationIndex}
                      className="flex items-center space-x-3 opacity-50"
                    >
                      <div className="h-4 w-4 flex-shrink-0 flex items-center justify-center">
                        <div className="h-0.5 w-3 bg-muted-foreground"></div>
                      </div>
                      <span className="text-sm text-muted-foreground line-through">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full mt-6 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  } transition-all duration-200 hover:scale-105`}
                >
                  Elegir {plan.name}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="mb-16 animate-in fade-in-50 slide-in-from-bottom-6 duration-700">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Servicios Adicionales
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Potencia tu perfil con nuestros servicios adicionales y obtén
              mayor visibilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <Card
                key={addon.id}
                className="hover:shadow-xl transition-all duration-300 hover:border-purple-300 animate-in zoom-in-50"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center">
                      <addon.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {addon.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {addon.description}
                  </p>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-foreground">
                      {formatPrice(addon.price)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {addon.duration}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-500 transition-all duration-200"
                  >
                    Agregar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center animate-in fade-in-50 slide-in-from-bottom-8 duration-900">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ¿Tienes preguntas?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Consulta nuestras preguntas frecuentes o contáctanos directamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/faq">
              <Button
                variant="outline"
                className="hover:bg-muted/50 transition-colors duration-200"
              >
                Ver FAQ
              </Button>
            </Link>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contactar Soporte
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Badge */}
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <Badge className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white px-3 py-1 shadow-lg hover:scale-105 transition-transform duration-200">
          🟢 NICOLAS ALVAREZ
        </Badge>
      </div>
    </div>
  );
}
