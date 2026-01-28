'use client';

import HeaderComponent from '@/components/header/Header';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    '/autenticacion/post-register',
    '/maintenance'
  ];

  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  // Asegurar que solo se renderice en el cliente para evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 1. Si estamos en modo mantenimiento (variable de entorno), ocultar header SIEMPRE
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return null;
  }

  // 2. Si la ruta es la página de mantenimiento, ocultar header
  // Usamos includes para ser más tolerantes
  if (pathname && pathname.includes('/maintenance')) {
    return null;
  }

  // 3. Verificar si la ruta actual está en la lista de rutas donde ocultar el header
  const shouldHideHeader = hideHeaderRoutes.some(route => pathname === route || pathname.startsWith(route));

  if (shouldHideHeader) {
    return null;
  }

  // No renderizar nada durante la hidratación inicial (se mantiene al final para evitar flashes si es posible)
  if (!isClient) {
    return null;
  }

  // Renderizar el header normalmente
  return <HeaderComponent />;
}