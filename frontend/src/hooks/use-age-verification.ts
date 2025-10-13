"use client";

import { useState, useEffect } from 'react';
import { getCookie, setCookie } from 'cookies-next';

const AGE_VERIFICATION_COOKIE = 'ageVerified';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

export interface AgeVerificationState {
  isVerified: boolean;
  isLoading: boolean;
  showModal: boolean;
}

export const useAgeVerification = () => {
  const [state, setState] = useState<AgeVerificationState>({
    isVerified: false,
    isLoading: true,
    showModal: false,
  });

  useEffect(() => {
    // Verificar si existe la cookie de verificación de edad al iniciar
    const ageVerificationCookie = getCookie(AGE_VERIFICATION_COOKIE);
    
    if (ageVerificationCookie === 'true') {
      setState({
        isVerified: true,
        isLoading: false,
        showModal: false,
      });
    } else {
      setState({
        isVerified: false,
        isLoading: false,
        showModal: true,
      });
    }
  }, []);

  const confirmAge = () => {
    // Guardar confirmación en cookie con duración de 1 año
    setCookie(AGE_VERIFICATION_COOKIE, 'true', {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    setState({
      isVerified: true,
      isLoading: false,
      showModal: false,
    });
  };

  const denyAge = () => {
    // Redirigir a una página externa o mostrar mensaje de restricción
    window.location.href = 'https://www.google.com';
  };

  const resetVerification = () => {
    // Eliminar cookie (útil para testing o logout)
    setCookie(AGE_VERIFICATION_COOKIE, '', {
      maxAge: -1,
      path: '/',
    });

    setState({
      isVerified: false,
      isLoading: false,
      showModal: true,
    });
  };

  return {
    ...state,
    confirmAge,
    denyAge,
    resetVerification,
  };
};