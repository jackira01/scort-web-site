'use client';

import React, { useState, useCallback, useRef } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Crop, RotateCcw, ZoomIn } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { processCroppedImageCentralized, calculateOptimalProcessingOptions } from '../utils/centralizedImageProcessor';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
  aspectRatio?: number;
  fileName?: string;
}

interface CroppedAreaPixels {
  width: number;
  height: number;
  x: number;
  y: number;
}

// Función para crear la imagen recortada
// Las funciones de procesamiento ahora están centralizadas en centralizedImageProcessor.ts

export function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  fileName = 'imagen'
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.5);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels as CroppedAreaPixels);
    },
    []
  );

  const onMediaLoaded = useCallback((mediaSize: { width: number; height: number }) => {
    setImageInfo(mediaSize);
  }, []);

  const handleCropImage = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);

      // Calcular opciones óptimas de procesamiento
      const processingOptions = calculateOptimalProcessingOptions({
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height
      });

      // Procesar la imagen de forma centralizada (crop + marca de agua + optimización)
      const processedResult = await processCroppedImageCentralized(
        imageSrc,
        croppedAreaPixels,
        rotation,
        processingOptions,
        fileName
      );

      // Convertir el File a Blob para mantener compatibilidad
      const blob = new Blob([await processedResult.file.arrayBuffer()], { type: processedResult.file.type });

      onCropComplete(blob, processedResult.url);
      onClose();
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback: crear un canvas simple para el crop
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();

        image.onload = () => {
          canvas.width = croppedAreaPixels.width;
          canvas.height = croppedAreaPixels.height;

          ctx?.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
          );

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              onCropComplete(blob, url);
              onClose();
            }
          }, 'image/jpeg', 0.9);
        };

        image.src = imageSrc;
      } catch (fallbackError) {
        console.error('Fallback crop failed:', fallbackError);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, rotation, onCropComplete, onClose, fileName]);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(0.5);
    setRotation(0);
  };

  const isImageTooSmall = imageInfo && (imageInfo.width < 500 || imageInfo.height < 600);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Recortar imagen: {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia de dimensiones */}
          {isImageTooSmall && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                <strong>Advertencia:</strong> Esta imagen tiene dimensiones menores a las recomendadas (500x600px).
                La calidad final podría verse afectada.
              </AlertDescription>
            </Alert>
          )}

          {/* Información de la imagen */}
          {imageInfo && (
            <div className="flex gap-2">
              <Badge variant="outline">
                Dimensiones: {imageInfo.width} × {imageInfo.height}px
              </Badge>
              <Badge variant={isImageTooSmall ? "destructive" : "default"}>
                {isImageTooSmall ? "Menor a recomendado" : "Dimensiones óptimas"}
              </Badge>
            </div>
          )}

          {/* Área de recorte */}
          <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteCallback}
              onZoomChange={setZoom}
              onMediaLoaded={onMediaLoaded}
              showGrid={true}
              restrictPosition={false}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'transparent'
                },
                cropAreaStyle: {
                  border: '2px solid #3b82f6',
                  borderRadius: '4px'
                },
                mediaStyle: {
                  transform: 'none'
                }
              }}
            />
          </div>

          {/* Controles */}
          <div className="space-y-4">
            {/* Control de zoom */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                <span className="text-sm font-medium">Zoom: {zoom.toFixed(1)}x</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Control de rotación */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                <span className="text-sm font-medium">Rotación: {rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={resetCrop}>
            Restablecer
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleCropImage}
              disabled={!croppedAreaPixels || isProcessing}
            >
              {isProcessing ? 'Procesando...' : 'Aplicar recorte'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}