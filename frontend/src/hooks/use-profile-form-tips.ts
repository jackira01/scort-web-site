import { useConfigValues } from './use-config-parameters';

export interface ProfileFormTip {
  step: number;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  content: string | string[];
  icon?: string;
}

export interface ProfileFormTipsConfig {
  [key: string]: ProfileFormTip;
}

/**
 * Hook para obtener los tips dinámicos del formulario de perfil
 * Ahora obtiene los datos usando las keys específicas: profile.form.step.1, profile.form.step.2, etc.
 */
export function useProfileFormTips() {
  // Definir las keys específicas para cada paso
  const stepKeys = [
    'profile.form.step.1',
    'profile.form.step.2',
    'profile.form.step.3',
    'profile.form.step.4',
    'profile.form.step.5'
  ];

  const { values, loading: isLoading, error } = useConfigValues(stepKeys);

  // Transformar los valores en tips organizados por paso
  const tipsByStep = stepKeys.reduce((acc, key, index) => {
    const stepNumber = index + 1;
    const stepValue = values[key];

    if (stepValue && Array.isArray(stepValue)) {
      try {
        acc[stepNumber] = stepValue.map(item => {
          // La estructura real es: { type: "tip" | "warning", text: string | string[] }
          const tipType = item.type === 'warning' ? 'warning' : 'info';
          const content = Array.isArray(item.text) ? item.text : [item.text];

          return {
            step: stepNumber,
            type: tipType as 'info' | 'warning',
            title: item.type === 'warning' ? 'Advertencia' : 'Consejo',
            content: content,
            icon: item.type === 'warning' ? 'alert-triangle' : 'lightbulb'
          };
        });
      } catch (error) {
        console.warn(`Error parsing tip parameter ${key}:`, error);
        acc[stepNumber] = [];
      }
    } else {
      acc[stepNumber] = [];
    }

    return acc;
  }, {} as Record<number, ProfileFormTip[]>);

  // Obtener tips para un paso específico
  const getTipsForStep = (step: number): ProfileFormTip[] => {
    return tipsByStep[step] || [];
  };

  // Verificar si hay tips disponibles para un paso
  const hasTipsForStep = (step: number): boolean => {
    return (tipsByStep[step] || []).length > 0;
  };

  return {
    tipsByStep,
    getTipsForStep,
    hasTipsForStep,
    isLoading,
    error,
    hasData: Object.keys(values).length > 0
  };
}

/**
 * Hook para obtener tips por defecto (fallback) cuando no hay configuración dinámica
 */
export function useDefaultProfileFormTips(): Record<number, ProfileFormTip[]> {
  return {
    1: [
      {
        step: 1,
        type: 'info',
        title: 'Consejo rápido',
        content: 'Incrementa las visitas a tu sitio con un nombre y título super atrayente !',
        icon: 'lightbulb'
      }
    ],
    2: [
      {
        step: 2,
        type: 'success',
        title: 'Consejos',
        content: [
          'Sé honesto y auténtico en tu descripción',
          'Menciona tus mejores cualidades',
          'Usa un lenguaje profesional',
          'Especifica claramente tus servicios'
        ],
        icon: 'check-circle'
      },
      {
        step: 2,
        type: 'error',
        title: 'Prohibido',
        content: [
          'Contenido explícito o vulgar',
          'Información falsa o engañosa',
          'Servicios ilegales',
          'Discriminación de cualquier tipo'
        ],
        icon: 'alert-triangle'
      }
    ],
    3: [
      {
        step: 3,
        type: 'info',
        title: 'Información importante',
        content: [
          'Tu número de teléfono será privado',
          'Solo se mostrará parcialmente',
          'Los clientes podrán contactarte a través de la plataforma',
          'Puedes cambiar tu disponibilidad en cualquier momento',
          'Configura tus tarifas según el tiempo de servicio',
          'Puedes agregar múltiples opciones de tiempo y precio'
        ],
        icon: 'info'
      }
    ],
    4: [
      {
        step: 4,
        type: 'info',
        title: 'Recomendaciones',
        content: [
          'Sube tus mejores fotos y videos, se pueden redimensionar o recortar una vez subidas.',
          'Sube fotos y videos bien iluminados, no tienen que ser profesionales, pero sí con luz de frente y buena resolución.',
          'Si necesitas ocultar tu rostro púdelo, no lo ocultes con emojis o adornos.',
          'Agrega una foto de portada a tus videos. Puedes subir fotos/videos con otras personas, pero no se les puede ver la cara.'
        ],
        icon: 'lightbulb'
      },
      {
        step: 4,
        type: 'error',
        title: 'Restricciones',
        content: [
          'No agregues fotos/videos que no son tuyos.',
          'No añadas texto a tus fotos/videos.',
          'No se pueden subir fotos con niños/as o ambientes infantiles o que sugieran relaciones con niños/as.',
          'No se pueden subir fotos con animales o que sugieran relaciones con ellos.',
          'No subas dibujos o imágenes generadas por IA.',
          'No subas collages (unión de varias fotos en una), sube las fotos de una en una en lugar de unirlas.',
          'Si se detectan fotos repetidas se eliminarán.',
          'Sube solo fotos/videos con logos de otras webs.',
          'Fotos/videos que incumplan los límites aquí descritos se eliminarán o incluso pueden hacer que se vete el perfil.'
        ],
        icon: 'alert-triangle'
      }
    ],
    5: [
      {
        step: 5,
        type: 'info',
        title: 'Consejo rápido',
        content: 'Escoge el plan que más se adapte a tu necesidad y flujo de ingresos. Recuerda que adicionalmente hay un Boost (impulso) que puede subir tu perfil a los primeros lugares durante 24 horas. RECUERDA que te contactaremos para verificar tu perfil y tus fotos, incluyendo diferentes imágenes en tu perfil de acuerdo al nivel de verificación, insignia que le dará mayor confianza a tus potenciales clientes.',
        icon: 'lightbulb'
      }
    ]
  };
}