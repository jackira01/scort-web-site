'use client';

import { useProfileFormTips, useDefaultProfileFormTips } from '@/hooks/use-profile-form-tips';
import { TipCard } from '@/components/profile-form/TipCard';

interface SidebarContentProps {
  currentStep: number;
}

export function SidebarContent({ currentStep }: SidebarContentProps) {
  const { getTipsForStep, hasTipsForStep, isLoading } = useProfileFormTips();
  const defaultTips = useDefaultProfileFormTips();

  // Si está cargando, mostrar un placeholder
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg animate-pulse">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  // Obtener tips dinámicos o usar los por defecto
  const tips = hasTipsForStep(currentStep) 
    ? getTipsForStep(currentStep) 
    : defaultTips[currentStep] || [];

  // Si no hay tips, no renderizar nada
  if (!tips || tips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {tips.map((tip, index) => (
        <TipCard key={index} tip={tip} />
      ))}
    </div>
  );
}
