import type React from 'react';

/**
 * Layout específico para páginas de autenticación
 * Este layout no incluye el header para proporcionar una experiencia más limpia
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}