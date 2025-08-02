'use client';

import { Lightbulb, Edit, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface SidebarContentProps {
  currentStep: number;
}

export function SidebarContent({ currentStep }: SidebarContentProps) {
  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Consejo rápido
              </h3>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Incrementa las visitas a tu sitio con un nombre y título super
              atrayente !
            </p>
          </div>
        </div>
      );

    case 2:
      return (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Consejos
              </h3>
            </div>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Sé honesto y auténtico en tu descripción</li>
              <li>• Menciona tus mejores cualidades</li>
              <li>• Usa un lenguaje profesional</li>
              <li>• Especifica claramente tus servicios</li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Prohibido
              </h3>
            </div>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• Contenido explícito o vulgar</li>
              <li>• Información falsa o engañosa</li>
              <li>• Servicios ilegales</li>
              <li>• Discriminación de cualquier tipo</li>
            </ul>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Información importante
              </h3>
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Tu número de teléfono será privado</li>
              <li>• Solo se mostrará parcialmente</li>
              <li>
                • Los clientes podrán contactarte a través de la plataforma
              </li>
              <li>• Puedes cambiar tu disponibilidad en cualquier momento</li>
              <li>• Configura tus tarifas según el tiempo de servicio</li>
              <li>• Puedes agregar múltiples opciones de tiempo y precio</li>
            </ul>
          </div>
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Recomendaciones
              </h3>
              <Edit className="h-3 w-3 text-blue-600" />
            </div>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>
                • Sube tus mejores fotos y videos, se pueden redimensionar o
                recortar una vez subidas.
              </li>
              <li>
                • Sube fotos y videos bien iluminados, no tienen que ser
                profesionales, pero sí con luz de frente y buena resolución.
              </li>
              <li>
                • Si necesitas ocultar tu rostro púdelo, no lo ocultes con
                emojis o adornos.
              </li>
              <li>
                • Agrega una foto de portada a tus videos. Puedes subir
                fotos/videos con otras personas, pero no se les puede ver la
                cara.
              </li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Restricciones
              </h3>
            </div>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• No agregues fotos/videos que no son tuyos.</li>
              <li>• No añadas texto a tus fotos/videos.</li>
              <li>
                • No se pueden subir fotos con niños/as o ambientes infantiles
                o que sugieran relaciones con niños/as.
              </li>
              <li>
                • No se pueden subir fotos con animales o que sugieran
                relaciones con ellos.
              </li>
              <li>• No subas dibujos o imágenes generadas por IA.</li>
              <li>
                �� No subas collages (unión de varias fotos en una), sube las
                fotos de una en una en lugar de unirlas.
              </li>
              <li>• Si se detectan fotos repetidas se eliminarán.</li>
              <li>• Sube solo fotos/videos con logos de otras webs.</li>
              <li>
                • Fotos/videos que incumplan los límites aquí descritos se
                eliminarán o incluso pueden hacer que se vete el perfil.
              </li>
            </ul>
          </div>
        </div>
      );

    case 5:
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Consejo rápido
              </h3>
              <Edit className="h-3 w-3 text-blue-600" />
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Escoge el plan que más se adapte a tu necesidad y flujo de
              ingresos. Recuerda que adicionalmente hay un Boost (impulso) que
              puede subir tu perfil a los primeros lugares durante 24 horas.
              RECUERDA que te contactaremos para verificar tu perfil y tus
              fotos, incluyendo diferentes imágenes en tu perfil de acuerdo al
              nivel de verificación, insignia que le dará mayor confianza a
              tus potenciales clientes.
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
