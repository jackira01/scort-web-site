'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import HeaderComponent from '@/components/header/Header';

/**
 * Componente que renderiza condicionalmente el header basado en la ruta actual
 * Oculta el header en páginas de autenticación para una experiencia más limpia
 */
export default function ConditionalHeader() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  
  // Rutas donde NO se debe mostrar el header
  const hideHeaderRoutes = [
    '/autenticacion/verificar-email',
    '/autenticacion/post-register'
  ];
  
  // Asegurar que solo se renderice en el cliente para evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Verificar si la ruta actual está en la lista de rutas donde ocultar el header
  const shouldHideHeader = hideHeaderRoutes.some(route => pathname === route);
  
  // No renderizar nada durante la hidratación inicial
  if (!isClient) {
    return null;
  }
  
  // Si debe ocultar el header, no renderizar nada
  if (shouldHideHeader) {
    return null;
  }
  
  // Renderizar el header normalmente
  return <HeaderComponent />;
}