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

  if (!stepData || typeof stepData !== 'object') {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay datos disponibles para este paso de verificación.</p>
      </div>
    );
  }

  switch (step.key) {
    case 'documentPhotos': {
      const documentData = stepData as ProfileVerificationData['data']['steps']['documentPhotos'];
      const photos = [
        { key: 'frontPhoto', label: 'Documento (frontal)', url: documentData.frontPhoto },
        { key: 'backPhoto', label: 'Documento (reverso)', url: documentData.backPhoto },
        { key: 'selfieWithDocument', label: 'Selfie con documento', url: documentData.selfieWithDocument }
      ].filter(photo => photo.url);

      if (photos.length === 0) {
        return (
          <div className="mt-4 text-gray-500 text-center">
            No hay fotos de documentos.
          </div>
        );
      }

      return (
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.key} className="relative group">
                <CloudinaryImage
                  src={photo.url!}
                  alt={photo.label}
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onPreviewImage(photo.url!)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onPreviewImage(photo.url!)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-1 text-center">{photo.label}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'videoVerification': {
      const currentVideoLink = getCurrentVideoLink('videoVerification');

      return (
        <div className="mt-4 space-y-4">
          {/* Input para editar el videoLink */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Link de Video de Verificación
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={currentVideoLink}
              onChange={(e) => handleVideoLinkChange('videoVerification', e.target.value)}
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
                  Ver video de verificación
                </Button>
              )}
            </div>
          )}
        </div>
      );
    }

    case 'videoCallRequested': {
      const currentVideoLink = getCurrentVideoLink(step.key as 'videoCallRequested');

      return (
        <div className="mt-4 space-y-4">
          {/* Input para editar el videoLink de videollamada */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Link de Videollamada
            </label>
            <Input
              type="url"
              placeholder="https://meet.google.com/... o https://zoom.us/..."
              value={currentVideoLink}
              onChange={(e) => handleVideoLinkChange(step.key as 'videoCallRequested', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Ingresa el enlace de la videollamada programada para verificación en tiempo real
            </p>
          </div>

          {/* Mostrar el link actual si existe */}
          {currentVideoLink && (
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  window.open(currentVideoLink, '_blank');
                }}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir videollamada
              </Button>
            </div>
          )}
        </div>
      );
    }

    case 'socialMedia': {
      const socialMediaData = stepData as ProfileVerificationData['data']['steps']['socialMedia'];

      return (
        <div className="mt-4">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-sm text-gray-600">
              Estado de verificación social: {socialMediaData.isVerified ? 'Verificado' : 'Pendiente'}
            </p>
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