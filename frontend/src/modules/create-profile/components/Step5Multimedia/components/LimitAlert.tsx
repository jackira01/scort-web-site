import React from 'react';
import Link from 'next/link';

interface LimitAlertProps {
    currentCount: number;
    maxCount: number;
    planName?: string;
    planCode?: string;
    type: 'photos' | 'videos' | 'audios';
}

const TYPE_LABELS = {
    photos: 'fotos',
    videos: 'videos',
    audios: 'audios',
};

const PREMIUM_BENEFITS = {
    photos: ['Hasta 50+ fotos de alta calidad', 'Mayor visibilidad en búsquedas'],
    videos: ['Hasta 20+ videos', 'Mejor posicionamiento'],
    audios: ['Hasta 15+ audios', 'Perfil destacado'],
};

export const LimitAlert: React.FC<LimitAlertProps> = ({
    currentCount,
    maxCount,
    planName,
    planCode,
    type,
}) => {
    if (currentCount < maxCount) return null;

    const typeLabel = TYPE_LABELS[type];
    const isFree = planCode === 'FREE';

    return (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">💎</span>
                </div>
                <div className="flex-1">
                    <p className="text-purple-800 dark:text-purple-200 text-sm font-medium mb-2">
                        <strong>¡Has superado el límite!</strong>
                    </p>
                    <p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
                        Has alcanzado el máximo de {maxCount} {typeLabel} para {planName || 'tu plan actual'}.
                        Si deseas subir más {typeLabel}, mejora tu plan ahora y desbloquea todo el potencial de tu perfil.
                    </p>
                    {isFree && (
                        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 border border-purple-200/50">
                            <p className="text-purple-800 dark:text-purple-200 text-sm font-medium mb-2">
                                ✨ Con un plan Premium obtienes:
                            </p>
                            <ul className="text-purple-700 dark:text-purple-300 text-xs space-y-1">
                                {PREMIUM_BENEFITS[type].map((benefit, i) => (
                                    <li key={i}>• {benefit}</li>
                                ))}
                                <li>• Funciones exclusivas premium</li>
                                <li>• Soporte prioritario</li>
                            </ul>
                            <Link href="/planes">
                                <button className="mt-3 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                                    Ver Planes Premium
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
