import { CheckCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VerificationBarProps {
  // Flexibilizamos la interfaz para aceptar cualquier forma de objeto de verificación
  verification?: {
    isVerified?: boolean;
    verificationLevel?: number;
    verificationProgress?: number;
    progress?: number; // Agregamos 'progress' por si acaso
    [key: string]: any; // Firma de índice para permitir otras propiedades
  } | boolean | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function VerificationBar({ verification, className = '', size = 'sm' }: VerificationBarProps) {
  // 1. Manejo robusto de null/undefined
  if (!verification) {
    return null; // O retornar una barra vacía/gris si prefieres
  }

  // 2. Determinar si está verificado (booleano)
  const isVerified = typeof verification === 'boolean'
    ? verification
    : !!verification?.isVerified; // Doble negación para asegurar booleano

  // 3. Determinar el progreso (número)
  let rawProgress: number | string | undefined = 0;

  if (typeof verification === 'object') {
    // Intentamos buscar la propiedad con varios nombres comunes
    if (verification.verificationProgress !== undefined && verification.verificationProgress !== null) {
      rawProgress = verification.verificationProgress;
    } else if (verification.progress !== undefined && verification.progress !== null) {
      rawProgress = verification.progress;
    } else if (verification.verificationLevel !== undefined && verification.verificationLevel !== null) {
      rawProgress = verification.verificationLevel;
    } else if (isVerified) {
      // Fallback: si es un objeto verificado pero sin número explícito
      rawProgress = 85;
    }
  } else if (isVerified) {
    // Caso: verification = true
    rawProgress = 85;
  }

  // 4. Sanitización final (String -> Number, NaN -> 0, Clamping 0-100)
  const numericProgress = Number(rawProgress);
  const finalProgress = Math.min(100, Math.max(0,
    !isNaN(numericProgress) ? Math.round(numericProgress) : 0
  ));

  // Lógica de colores y textos
  const getVerificationColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getVerificationText = (progress: number) => {
    if (progress >= 80) return 'Altamente Verificado';
    if (progress >= 60) return 'Verificado';
    if (progress >= 30) return 'Parcialmente Verificado';
    return 'Sin Verificar';
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const paddingSize = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Barra de progreso */}
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 min-w-[60px]">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${getVerificationColor(finalProgress)}`}
          style={{ width: `${finalProgress}%` }}
        />
      </div>

      {/* Badge con icono */}
      <Badge
        className={`${paddingSize} ${getVerificationColor(finalProgress)} text-white border-0 ${textSize} font-medium whitespace-nowrap`}
      >
        <Shield className={`${iconSize} mr-1`} />
        {size === 'md' ? getVerificationText(finalProgress) : `${finalProgress}%`}
      </Badge>
    </div>
  );
}

export default VerificationBar;