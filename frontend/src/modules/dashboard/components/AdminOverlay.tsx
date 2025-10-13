'use client';

import { cn } from '@/lib/utils';

interface AdminOverlayProps {
  isVisible: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function AdminOverlay({ isVisible, onClick, children }: AdminOverlayProps) {
  return (
    <div className="relative min-h-screen">
      {/* Overlay de fondo con opacidad */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-all duration-300 ease-in-out",
          isVisible 
            ? "opacity-100 pointer-events-auto" 
            : "opacity-0 pointer-events-none"
        )}
        onClick={onClick}
        aria-hidden="true"
      />

      {/* Contenido principal con efecto de opacidad */}
      <div
        className={cn(
          "relative z-10 transition-all duration-300 ease-in-out",
          isVisible 
            ? "opacity-60 scale-[0.98] blur-[1px]" 
            : "opacity-100 scale-100 blur-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}