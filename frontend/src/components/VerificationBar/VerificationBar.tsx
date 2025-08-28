import { CheckCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VerificationBarProps {
  verification?: {
    isVerified?: boolean;
    verificationLevel?: number;
  } | boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function VerificationBar({ verification, className = '', size = 'sm' }: VerificationBarProps) {
  // Determinar si está verificado
  const isVerified = typeof verification === 'boolean' 
    ? verification 
    : verification?.isVerified || false;

  // Determinar el nivel de verificación (0-100)
  const verificationLevel = typeof verification === 'object' && verification?.verificationLevel
    ? verification.verificationLevel
    : isVerified ? 85 : 0;

  if (!isVerified || verificationLevel === 0) {
    return null;
  }

  const getVerificationColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getVerificationText = (level: number) => {
    if (level >= 80) return 'Altamente Verificado';
    if (level >= 60) return 'Verificado';
    return 'Parcialmente Verificado';
  };

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const paddingSize = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Barra de progreso */}
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 min-w-[60px]">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${getVerificationColor(verificationLevel)}`}
          style={{ width: `${verificationLevel}%` }}
        />
      </div>
      
      {/* Badge con icono */}
      <Badge 
        className={`${paddingSize} ${getVerificationColor(verificationLevel)} text-white border-0 ${textSize} font-medium`}
      >
        <Shield className={`${iconSize} mr-1`} />
        {size === 'md' ? getVerificationText(verificationLevel) : `${verificationLevel}%`}
      </Badge>
    </div>
  );
}

export default VerificationBar;