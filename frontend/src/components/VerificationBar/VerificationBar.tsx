import { CheckCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VerificationBarProps {
  verification?: {
    isVerified?: boolean;
    verificationLevel?: number;
    verificationProgress?: number;
  } | boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function VerificationBar({ verification, className = '', size = 'sm' }: VerificationBarProps) {
  // Determinar si está verificado
  const isVerified = typeof verification === 'boolean' 
    ? verification 
    : verification?.isVerified || false;

  // Determinar el progreso de verificación (0-100)
  const verificationProgress = typeof verification === 'object' && verification?.verificationProgress !== undefined
    ? verification.verificationProgress
    : typeof verification === 'object' && verification?.verificationLevel
    ? verification.verificationLevel
    : isVerified ? 85 : 0;

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
          className={`h-1.5 rounded-full transition-all duration-300 ${getVerificationColor(verificationProgress)}`}
          style={{ width: `${verificationProgress}%` }}
        />
      </div>
      
      {/* Badge con icono */}
      <Badge 
        className={`${paddingSize} ${getVerificationColor(verificationProgress)} text-white border-0 ${textSize} font-medium`}
      >
        <Shield className={`${iconSize} mr-1`} />
        {size === 'md' ? getVerificationText(verificationProgress) : `${verificationProgress}%`}
      </Badge>
    </div>
  );
}

export default VerificationBar;