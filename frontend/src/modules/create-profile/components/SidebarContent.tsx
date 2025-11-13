'use client';

import { useProfileFormTips, useDefaultProfileFormTips } from '@/hooks/use-profile-form-tips';
import { TipCard } from '@/components/profile-form/TipCard';

interface SidebarContentProps {
  currentStep: number;
  isEditMode?: boolean; // ✅ Prop para diferenciar creación vs edición
}

export function SidebarContent({ currentStep, isEditMode = false }: SidebarContentProps) {
  const { getTipsForStep, hasTipsForStep, isLoading } = useProfileFormTips();
  const defaultTips = useDefaultProfileFormTips();

  // ✅ Mapeo correcto SOLO para modo creación
  // En creación: paso 4 = Plan (tips de step.5) y paso 5 = Multimedia (tips de step.4)
  // En edición: los pasos coinciden naturalmente con el contenido (sin mapeo)
  const getMappedStepForTips = (currentStep: number): number => {
    // Si es modo edición, NO hacer mapeo
    if (isEditMode) {
      return currentStep;
    }

    // En el componente de creación:
    // currentStep 4 muestra <Step4Plan /> → necesita tips de "profile.form.step.5" (Plan)
    // currentStep 5 muestra <Step5Multimedia /> → necesita tips de "profile.form.step.4" (Multimedia)

    if (currentStep === 4) {
      return 5; // Obtener tips de step.5 (Plan)
    } else if (currentStep === 5) {
      return 4; // Obtener tips de step.4 (Multimedia)
    }

    return currentStep; // Pasos 1, 2, 3 se mantienen igual
  };

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

  // Obtener el paso mapeado correcto para los tips
  const mappedStep = getMappedStepForTips(currentStep);

  // Obtener tips dinámicos o usar los por defecto
  const tips = hasTipsForStep(mappedStep)
    ? getTipsForStep(mappedStep)
    : [];

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
