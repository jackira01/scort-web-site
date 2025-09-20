"use client";

import React, { useState, useEffect } from 'react';
import { useCookieConsent, CookiePreferences } from '@/contexts/CookieConsentContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, BarChart3, Target, Mail, Database, Cookie } from 'lucide-react';

const CookieConsentModal: React.FC = () => {
  const { showModal, preferences, acceptAll, savePreferences } = useCookieConsent();
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    email: true,
    storage: false,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleToggle = (category: keyof CookiePreferences) => {
    // No permitir cambiar las categorías obligatorias
    if (category === 'essential' || category === 'email') return;
    
    setLocalPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSavePreferences = () => {
    savePreferences(localPreferences);
  };

  if (!showModal) return null;

  const categories = [
    {
      key: 'essential' as keyof CookiePreferences,
      title: 'Cookies Esenciales',
      description: 'Necesarias para el funcionamiento básico del sitio, incluyendo autenticación y sesiones.',
      icon: Shield,
      required: true,
      details: 'Incluye cookies de NextAuth para login, cookies de sesión y funcionalidades básicas de seguridad.'
    },
    {
      key: 'email' as keyof CookiePreferences,
      title: 'Notificaciones por Email',
      description: 'Obligatorias para notificaciones de seguridad y noticias importantes.',
      icon: Mail,
      required: true,
      details: 'Necesarias para enviarte alertas de seguridad, actualizaciones importantes y comunicaciones críticas.'
    },
    {
      key: 'analytics' as keyof CookiePreferences,
      title: 'Analítica',
      description: 'Nos ayudan a entender cómo usas el sitio para mejorarlo.',
      icon: BarChart3,
      required: false,
      details: 'Google Analytics y herramientas similares para analizar el tráfico y comportamiento de usuarios.'
    },
    {
      key: 'marketing' as keyof CookiePreferences,
      title: 'Marketing y Seguimiento',
      description: 'Para personalizar anuncios y contenido relevante.',
      icon: Target,
      required: false,
      details: 'Facebook Pixel, Google Ads y otras herramientas de marketing para mostrar contenido personalizado.'
    },
    {
      key: 'storage' as keyof CookiePreferences,
      title: 'Almacenamiento Local',
      description: 'Para guardar preferencias y estado temporal en tu navegador.',
      icon: Database,
      required: false,
      details: 'LocalStorage y SessionStorage para mantener tus preferencias y mejorar la experiencia de usuario.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Cookie className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Configuración de Cookies
          </CardTitle>
          <CardDescription className="text-base">
            Respetamos tu privacidad. Elige qué tipos de cookies quieres permitir.
            Algunas son esenciales para el funcionamiento del sitio.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            const isEnabled = localPreferences[category.key];
            
            return (
              <div key={category.key}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {category.title}
                          {category.required && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              Obligatorio
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      </div>
                      
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggle(category.key)}
                        disabled={category.required}
                        className="ml-4"
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {category.details}
                    </p>
                  </div>
                </div>
                
                {index < categories.length - 1 && <Separator />}
              </div>
            );
          })}
          
          <div className="pt-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={acceptAll}
                className="flex-1"
                size="lg"
              >
                Aceptar Todas
              </Button>
              
              <Button 
                onClick={handleSavePreferences}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Guardar Preferencias
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Puedes cambiar estas preferencias en cualquier momento desde la configuración.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsentModal;