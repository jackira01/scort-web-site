"use client";

import React, { useState, useEffect } from "react";
import { useCookieConsent, CookiePreferences } from "@/contexts/CookieConsentContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Cookie } from "lucide-react";

const CookieConsentBanner: React.FC = () => {
  const { showModal, preferences, acceptAll, savePreferences } = useCookieConsent();
  const [expanded, setExpanded] = useState(false);
  const [openDetails, setOpenDetails] = useState<string | null>(null);
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    email: true,
    storage: false,
  });

  useEffect(() => {
    if (preferences) setLocalPreferences(preferences);
  }, [preferences]);

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === "essential" || category === "email") return;
    setLocalPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSavePreferences = () => {
    savePreferences(localPreferences);
    setExpanded(false);
  };

  if (!showModal) return null;

  const categories = [
    {
      key: "essential" as keyof CookiePreferences,
      label: "Esenciales",
      required: true,
      description: "Necesarias para el funcionamiento básico del sitio.",
      details:
        "Incluye cookies de autenticación, de sesión y de seguridad que garantizan que el sitio funcione correctamente.",
    },
    {
      key: "analytics" as keyof CookiePreferences,
      label: "Analítica",
      description: "Nos ayudan a entender cómo usas el sitio para mejorarlo.",
      details:
        "Google Analytics y herramientas similares para analizar el tráfico, rendimiento y comportamiento de usuarios.",
    },
    {
      key: "marketing" as keyof CookiePreferences,
      label: "Marketing y Seguimiento",
      description: "Permiten personalizar anuncios y contenido relevante.",
      details:
        "Incluye herramientas como Facebook Pixel o Google Ads para mostrar contenido adaptado a tus intereses.",
    },
    {
      key: "storage" as keyof CookiePreferences,
      label: "Almacenamiento Local",
      description: "Para guardar tus preferencias en tu navegador.",
      details:
        "Usa LocalStorage o SessionStorage para recordar tus configuraciones y mejorar tu experiencia.",
    },
  ];

  const toggleDetails = (key: string) => {
    setOpenDetails((prev) => (prev === key ? null : key));
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-border p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 transition-all">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Cookie className="h-6 w-6 text-primary" />
            <div>
              <h2 className="font-semibold text-base sm:text-lg">Usamos cookies</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Utilizamos cookies esenciales y opcionales para mejorar tu experiencia.
              </p>
            </div>
          </div>

          {!expanded && (
            <div className="hidden sm:flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>
                Configurar
              </Button>
              <Button size="sm" onClick={acceptAll}>
                Aceptar todas
              </Button>
            </div>
          )}
        </div>

        {/* Configuración expandida */}
        {expanded && (
          <div className="space-y-3 border-t border-border pt-3">
            {categories.map((cat) => (
              <div key={cat.key} className="py-1 border-b border-border/60 last:border-0">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{cat.label}</span>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDetails(cat.key)}
                      className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {openDetails === cat.key ? (
                        <ChevronUp className="h-4 w-4 mx-auto" />
                      ) : (
                        <ChevronDown className="h-4 w-4 mx-auto" />
                      )}
                    </button>

                    <Switch
                      checked={localPreferences[cat.key]}
                      onCheckedChange={() => handleToggle(cat.key)}
                      disabled={cat.required}
                    />
                  </div>
                </div>

                {/* Detalle desplegable (sin framer-motion) */}
                <div
                  className={`transition-all duration-300 overflow-hidden ${openDetails === cat.key ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0"
                    }`}
                >
                  <p className="text-xs text-muted-foreground">{cat.details}</p>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1" onClick={handleSavePreferences}>
                Guardar
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={acceptAll}>
                Aceptar todas
              </Button>
            </div>
          </div>
        )}

        {/* Footer botones (solo mobile) */}
        {!expanded && (
          <div className="flex sm:hidden gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setExpanded(true)}>
              Configurar
            </Button>
            <Button size="sm" className="flex-1" onClick={acceptAll}>
              Aceptar todas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsentBanner;
