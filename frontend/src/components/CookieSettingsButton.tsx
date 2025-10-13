"use client";

import React from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CookieSettingsButton: React.FC = () => {
  const { openSettings, hasConsent } = useCookieConsent();

  // Solo mostrar el botón si ya se ha dado consentimiento
  if (!hasConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={openSettings}
              size="sm"
              variant="outline"
              className="h-10 w-10 p-0 rounded-full shadow-lg bg-background/80 backdrop-blur-sm border-border/50 hover:bg-accent hover:scale-105 transition-all duration-200"
            >
              <Cookie className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Configurar cookies</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CookieSettingsButton;