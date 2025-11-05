"use client";

import React from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import CookieConsentModal from '@/components/CookieConsentModal';
import CookieSettingsButton from '@/components/CookieSettingsButton';

interface CookieConsentWrapperProps {
  children: React.ReactNode;
}

const CookieConsentWrapper: React.FC<CookieConsentWrapperProps> = ({ children }) => {
  const { showModal, hasConsent } = useCookieConsent();

  return (
    <>
      {/* Contenido principal con bloqueo condicional */}
      <div
        className={`${showModal && !hasConsent
            ? 'pointer-events-none'
            : ''
          } transition-all duration-300`}
      >
        {children}
      </div>

      {/* Modal de consentimiento */}
      <CookieConsentModal />

      {/* Botón para reabrir configuración */}
      <CookieSettingsButton />
    </>
  );
};

export default CookieConsentWrapper;