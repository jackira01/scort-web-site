"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAgeVerification, AgeVerificationState } from '@/hooks/use-age-verification';
import AgeVerificationModal from '@/components/AgeVerificationModal';

interface AgeVerificationContextType extends AgeVerificationState {
  confirmAge: () => void;
  denyAge: () => void;
  resetVerification: () => void;
}

const AgeVerificationContext = createContext<AgeVerificationContextType | undefined>(undefined);

export const useAgeVerificationContext = () => {
  const context = useContext(AgeVerificationContext);
  if (context === undefined) {
    throw new Error('useAgeVerificationContext must be used within an AgeVerificationProvider');
  }
  return context;
};

interface AgeVerificationProviderProps {
  children: ReactNode;
}

export const AgeVerificationProvider: React.FC<AgeVerificationProviderProps> = ({ children }) => {
  const ageVerification = useAgeVerification();

  const value: AgeVerificationContextType = {
    ...ageVerification,
  };

  return (
    <AgeVerificationContext.Provider value={value}>
      {/* Mostrar modal solo si no está verificado y no está cargando */}
      <AgeVerificationModal
        isOpen={ageVerification.showModal && !ageVerification.isLoading}
        onConfirm={ageVerification.confirmAge}
        onDeny={ageVerification.denyAge}
      />
      
      {/* Mostrar contenido solo si está verificado o si está cargando */}
      {(ageVerification.isVerified || ageVerification.isLoading) && children}
    </AgeVerificationContext.Provider>
  );
};