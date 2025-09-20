"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCookie, setCookie } from 'cookies-next';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  email: boolean;
  storage: boolean;
}

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  showModal: boolean;
  acceptAll: () => void;
  savePreferences: (prefs: CookiePreferences) => void;
  openSettings: () => void;
  hasConsent: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  email: true,
  storage: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

interface CookieConsentProviderProps {
  children: ReactNode;
}

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Verificar si existe la cookie de consentimiento al iniciar
    const cookieConsent = getCookie('cookieConsent');
    
    if (cookieConsent) {
      try {
        const parsedPreferences = JSON.parse(cookieConsent as string) as CookiePreferences;
        setPreferences(parsedPreferences);
        setHasConsent(true);
        setShowModal(false);
      } catch (error) {
        console.error('Error parsing cookie consent:', error);
        // Si hay error al parsear, mostrar modal
        setShowModal(true);
        setHasConsent(false);
      }
    } else {
      // No existe cookie, mostrar modal
      setShowModal(true);
      setHasConsent(false);
    }
  }, []);

  const acceptAll = () => {
    const allAcceptedPreferences: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      email: true,
      storage: true,
    };
    
    savePreferences(allAcceptedPreferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    // Asegurar que las esenciales siempre estén marcadas
    const finalPreferences: CookiePreferences = {
      ...prefs,
      essential: true,
      email: true, // Email notifications son obligatorias
    };

    setPreferences(finalPreferences);
    setHasConsent(true);
    setShowModal(false);

    // Guardar en cookie con duración de 1 año
    setCookie('cookieConsent', JSON.stringify(finalPreferences), {
      maxAge: 60 * 60 * 24 * 365, // 1 año
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  };

  const openSettings = () => {
    setShowModal(true);
  };

  const value: CookieConsentContextType = {
    preferences,
    showModal,
    acceptAll,
    savePreferences,
    openSettings,
    hasConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};