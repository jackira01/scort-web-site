import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CloudinaryImage from '@/components/CloudinaryImage';
import { ExternalLink, Eye } from 'lucide-react';
import type { ProfileVerificationData, VerificationStepRenderProps } from '../types/verification.types';

const VerificationStepRenderer: React.FC<VerificationStepRenderProps> = ({
  step,
  stepData,
  onPreviewImage,
  getCurrentVideoLink,
  handleVideoLinkChange,
}) => {
  if (!stepData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">No hay datos de verificación disponibles</p>
      </div>
    );
  }

  switch (step.key) {
    case 'documentPhotos': {
      const documents = (stepData as ProfileVerificationData['steps']['documentPhotos']).documents || [];

      if (documents.length === 0) {
        return (
          <div className="mt-4 text-gray-500 text-center">
            No hay documentos disponibles.
          </div>
        );
      }

      return (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2">
            {documents.map((doc, index) => {
              return (
                <div key={`document-${doc}`} className="relative group">
                  <div className="relative">
                    <CloudinaryImage
                      src={doc}
                      alt={`Documento ${index + 1}`}
                      width={150}
                      height={100}
                      className="rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onPreviewImage(doc)}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'video': {
      const currentVideoLink = getCurrentVideoLink(step.key as 'video');

      return (
        <div className="mt-4 space-y-4">
          {/* Input para editar el videoLink */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Link de Video
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={currentVideoLink}
              onChange={(e) => handleVideoLinkChange(step.key as 'video', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Mostrar el video/link actual si existe */}
          {currentVideoLink && (
            <div>
              {/* Check if it's a video file or external link */}
              {(
                currentVideoLink.includes('.mp4') ||
                currentVideoLink.includes('.webm') ||
                currentVideoLink.includes('.ogg')
              ) ? (
                <video
                  src={currentVideoLink}
                  controls
                  className="w-full max-w-md rounded-lg"
                >
                  Tu navegador no soporta el elemento de video.
                </video>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(currentVideoLink, '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver video
                </Button>
              )}
            </div>
          )}
        </div>
      );
    }

    case 'socialMedia': {
      const accounts = (stepData as ProfileVerificationData['steps']['socialMedia']).accounts || [];

      if (accounts.length === 0) {
        return (
          <div className="mt-4 text-gray-500 text-center">
            No hay cuentas de redes sociales.
          </div>
        );
      }

      return (
        <div className="mt-4">
          <div className="space-y-2">
            {accounts.map((account, index) => {
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => {
                    window.open(account, '_blank');
                  }}
                  className="flex items-center gap-2 w-full justify-start"
                >
                  <ExternalLink className="h-4 w-4" />
                  {account}
                </Button>
              );
            })}
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="mt-4 text-gray-500 text-center">
          Tipo de verificación no reconocido.
        </div>
      );
  }
};

export default VerificationStepRenderer;