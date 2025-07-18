"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, X } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VerificationImage {
  id: number;
  url: string;
  alt: string;
  verified?: boolean;
}

interface ProfileVerificationCarouselProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  images: VerificationImage[];
  onVerifyProfile: () => void;
}

export default function ProfileVerificationCarousel({
  isOpen,
  onOpenChange,
  profileName,
  images,
  onVerifyProfile,
}: ProfileVerificationCarouselProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [verifiedImages, setVerifiedImages] = useState<Set<number>>(new Set());

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleImageVerification = (imageId: number) => {
    setVerifiedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const allImagesVerified =
    images.length > 0 && verifiedImages.size === images.length;

  if (images.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Verificación de Perfil - {profileName}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No hay imágenes disponibles para verificar este perfil.
            </p>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:bg-purple-50 dark:hover:bg-purple-950/20"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Verificación de Perfil - {profileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Imagen {currentImageIndex + 1} de {images.length}
            </span>
            <Badge
              variant={allImagesVerified ? "default" : "secondary"}
              className={
                allImagesVerified
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                  : ""
              }
            >
              {verifiedImages.size}/{images.length} verificadas
            </Badge>
          </div>

          {/* Main carousel container */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <CardContent className="p-0">
              <div className="relative h-96 flex items-center justify-center">
                {/* Navigation buttons */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 z-10 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black shadow-lg"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 z-10 bg-white/80 dark:bg-black/80 hover:bg-white dark:hover:bg-black shadow-lg"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Current image */}
                <div className="relative w-full h-full">
                  <Image
                    src={images[currentImageIndex]?.url || "/placeholder.svg"}
                    alt={
                      images[currentImageIndex]?.alt || "Imagen de verificación"
                    }
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                  />

                  {/* Verification status overlay */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={
                        verifiedImages.has(images[currentImageIndex]?.id)
                          ? "default"
                          : "secondary"
                      }
                      className={
                        verifiedImages.has(images[currentImageIndex]?.id)
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                          : ""
                      }
                    >
                      {verifiedImages.has(images[currentImageIndex]?.id) ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      {verifiedImages.has(images[currentImageIndex]?.id)
                        ? "Verificada"
                        : "No verificada"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Image verification controls */}
              <div className="p-4 border-t bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="space-x-2">
                    <Button
                      variant={
                        verifiedImages.has(images[currentImageIndex]?.id)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        toggleImageVerification(images[currentImageIndex]?.id)
                      }
                      className={
                        verifiedImages.has(images[currentImageIndex]?.id)
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500"
                      }
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {verifiedImages.has(images[currentImageIndex]?.id)
                        ? "Verificada"
                        : "Verificar Imagen"}
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {images[currentImageIndex]?.alt || "Imagen de verificación"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="flex justify-center space-x-2 max-w-full overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    index === currentImageIndex
                      ? "border-purple-500 ring-2 ring-purple-500/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  {verifiedImages.has(image.id) && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-50 dark:hover:bg-gray-950/20"
            >
              Cancelar
            </Button>

            <Button
              onClick={onVerifyProfile}
              disabled={!allImagesVerified}
              className={`${
                allImagesVerified
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              } transition-all duration-200`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Verificar Perfil
              {!allImagesVerified && (
                <span className="ml-2 text-xs">
                  ({verifiedImages.size}/{images.length})
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
