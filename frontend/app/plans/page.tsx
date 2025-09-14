'use client';

import React from 'react';
import { usePlans } from '@/hooks/usePlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PlansPage = () => {
  const { data: plansData, isLoading, error } = usePlans({ isActive: true });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Error al cargar planes</h1>
            <p className="text-gray-600">No pudimos cargar los planes disponibles. Intenta nuevamente más tarde.</p>
          </div>
        </div>
      </div>
    );
  }

  const plans = plansData?.plans || [];
  const sortedPlans = [...plans].sort((a, b) => a.level - b.level);

  const getPlanIcon = (level: number) => {
    switch (level) {
      case 1:
        return <Zap className="h-6 w-6" />;
      case 2:
        return <Star className="h-6 w-6" />;
      case 3:
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (level: number) => {
    switch (level) {
      case 1:
        return 'from-blue-500 to-blue-600';
      case 2:
        return 'from-purple-500 to-purple-600';
      case 3:
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanBadgeColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-blue-100 text-blue-800';
      case 2:
        return 'bg-purple-100 text-purple-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDays = (days: number) => {
    if (days === 1) return '1 día';
    if (days < 30) return `${days} días`;
    if (days === 30) return '1 mes';
    if (days < 365) return `${Math.round(days / 30)} meses`;
    return `${Math.round(days / 365)} año${days >= 730 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-200 mb-4">
            Elige tu Plan Perfecto
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-200">
            Descubre nuestros planes diseñados para potenciar tu presencia y conectar con más personas.
            Cada plan incluye características únicas para diferentes necesidades.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {sortedPlans.map((plan) => {
            const mainVariant = plan.variants?.[0];
            const isPopular = plan.features?.showInHome;
            const isSponsored = plan.features?.showInSponsored;

            return (
              <Card
                key={plan._id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isPopular ? 'ring-2 ring-purple-500 shadow-xl' : 'shadow-lg'
                  }`}
              >


                {/* Sponsored Badge */}
                {isSponsored && (
                  <div className="absolute top-4 left-4 z-10">
                    <Badge className="bg-yellow-500 text-white font-semibold px-3 py-1">
                      Destacado
                    </Badge>
                  </div>
                )}

                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${getPlanColor(plan.level)} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getPlanIcon(plan.level)}
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                    </div>

                  </div>

                  {mainVariant && (
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        {formatPrice(mainVariant.price)}
                      </div>
                      <div className="text-lg opacity-90">
                        por {formatDays(mainVariant.days)}
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  {/* Features */}
                  {mainVariant && (
                    <div className="space-y-4 mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">Características incluidas:</h4>

                      {/* Content Limits */}
                      <div className="space-y-2">
                        {plan.contentLimits && plan.contentLimits.photos && plan.contentLimits.photos.max > 0 && (
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              Hasta {plan.contentLimits.photos.max} fotos
                            </span>
                          </div>
                        )}

                        {plan.contentLimits && plan.contentLimits.videos && plan.contentLimits.videos.max > 0 && (
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              Hasta {plan.contentLimits.videos.max} videos
                            </span>
                          </div>
                        )}

                        {plan.contentLimits && plan.contentLimits.audios && plan.contentLimits.audios.max > 0 && (
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              Hasta {plan.contentLimits.audios.max} audios
                            </span>
                          </div>
                        )}

                        {plan.contentLimits && plan.contentLimits.storiesPerDayMax > 0 && (
                          <div className="flex items-center space-x-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              {plan.contentLimits.storiesPerDayMax} historias por día
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Plan Features */}
                      {plan.features && (
                        <div className="space-y-2">
                          {plan.features.showInFilters && (
                            <div className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-200">Aparece en filtros</span>
                            </div>
                          )}

                          {plan.features.showInHome && (
                            <div className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-200">Destacado en inicio</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Included Upgrades */}
                      {plan.includedUpgrades && plan.includedUpgrades.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-gray-800">Upgrades incluidos:</h5>
                          {plan.includedUpgrades.map((upgrade, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700">{upgrade}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Variants */}
                  {plan.variants && plan.variants.length > 1 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">Opciones de duración:</h4>
                      <div className="space-y-2">
                        {plan.variants.map((variant, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-800">{formatDays(variant.days)}</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-200">
                              {formatPrice(variant.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Button
                    className={`w-full bg-gradient-to-r ${getPlanColor(plan.level)} hover:opacity-90 transition-all duration-300 group`}
                    size="lg"
                  >
                    Seleccionar Plan
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">¿Necesitas ayuda para elegir?</CardTitle>
              <CardDescription className="text-lg">
                Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto para tus necesidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" size="lg">
                  Contactar Soporte
                </Button>
                <Button variant="outline" size="lg">
                  Ver FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;