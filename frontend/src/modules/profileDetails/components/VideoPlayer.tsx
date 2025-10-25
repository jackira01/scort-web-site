'use client'

import { ChevronLeft, ChevronRight, Maximize2, Volume2, VolumeX, X } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface VideoPlayerProps {
  videos: Array<{ link: string; preview: string } | string>;
}

export default function VideoPlayer({ videos }: VideoPlayerProps) {
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-play carrusel cada 3 segundos
  useEffect(() => {
    if (!videos || videos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentVideoIndex(prev =>
        prev === videos.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [videos]);

  // Pausar video al cambiar de índice
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.load();
    }
    setVideoError(false);
  }, [currentVideoIndex]);

  // Función para obtener la URL del video
  const getVideoUrl = (video: { link: string; preview: string } | string): string => {
    return typeof video === 'string' ? video : video.link;
  };

  // Función para obtener la URL del preview
  const getPreviewUrl = (video: { link: string; preview: string } | string): string => {
    if (typeof video === 'string') {
      return '/placeholder.svg';
    }
    return video.preview && video.preview.trim() !== '' ? video.preview : '/placeholder.svg';
  };

  const currentVideoUrl = videos.length > 0 ? getVideoUrl(videos[currentVideoIndex]) : '';
  const currentPreviewUrl = videos.length > 0 ? getPreviewUrl(videos[currentVideoIndex]) : '/placeholder.svg';

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoError(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
  };

  const handlePreviousVideo = () => {
    setCurrentVideoIndex(prev =>
      prev === 0 ? videos.length - 1 : prev - 1
    );
  };

  const handleNextVideo = () => {
    setCurrentVideoIndex(prev =>
      prev === videos.length - 1 ? 0 : prev + 1
    );
  };

  if (!videos || videos.length === 0) {
    return (
      <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-10 duration-1000">
        <CardContent className="p-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <p className="text-muted-foreground">No hay videos disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-10 duration-1000">
        <CardContent className="p-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
            {videoError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
                <div className="text-4xl mb-2">📹</div>
                <p className="text-sm">Error al cargar el video</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted={isVideoMuted}
                  onError={handleVideoError}
                  onLoadedData={handleVideoLoad}
                  poster={currentPreviewUrl}
                  preload="metadata"
                  playsInline
                  crossOrigin="anonymous"
                  controls
                >
                  <source src={currentVideoUrl} type="video/mp4" />
                  <source src={currentVideoUrl} type="video/webm" />
                  <source src={currentVideoUrl} type="video/ogg" />
                  Tu navegador no soporta el elemento video.
                </video>

                {/* Botón de Zoom */}
                <Button
                  size="icon"
                  className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm shadow-lg"
                  onClick={openModal}
                  title="Ver en pantalla completa"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>

                {/* Flechas de Navegación (solo si hay más de 1 video) */}
                {videos.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handlePreviousVideo}
                      title="Video anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleNextVideo}
                      title="Video siguiente"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Indicadores de posición */}
            {videos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {videos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentVideoIndex(index)}
                    className={`h-2 rounded-full transition-all shadow-lg ${index === currentVideoIndex
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/50 hover:bg-white/70'
                      }`}
                    aria-label={`Ir al video ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para ver video en pantalla completa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 bg-black/95 border-0">
          <VisuallyHidden>
            <DialogTitle>Video Player Modal</DialogTitle>
          </VisuallyHidden>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Botón de Cerrar */}
            <Button
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm shadow-lg"
              onClick={closeModal}
              title="Cerrar"
            >
              <X className="h-6 w-6" />
            </Button>

            {videoError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-800">
                <div className="text-6xl mb-4">📹</div>
                <p className="text-lg mb-2">Error al cargar el video</p>
                <p className="text-sm text-gray-300">El formato del video no es compatible</p>
              </div>
            ) : (
              <>
                <video
                  ref={modalVideoRef}
                  className="max-w-full max-h-full object-contain"
                  muted={isVideoMuted}
                  onError={handleVideoError}
                  onLoadedData={handleVideoLoad}
                  poster={currentPreviewUrl}
                  autoPlay
                  controls
                  preload="metadata"
                  playsInline
                  crossOrigin="anonymous"
                >
                  <source src={currentVideoUrl} type="video/mp4" />
                  <source src={currentVideoUrl} type="video/webm" />
                  <source src={currentVideoUrl} type="video/ogg" />
                  Tu navegador no soporta el elemento video.
                </video>

                {/* Flechas de Navegación en Modal */}
                {videos.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm shadow-lg"
                      onClick={handlePreviousVideo}
                      title="Video anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white backdrop-blur-sm shadow-lg"
                      onClick={handleNextVideo}
                      title="Video siguiente"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Indicadores en Modal */}
                {videos.length > 1 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {videos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentVideoIndex(index)}
                        className={`h-2 rounded-full transition-all shadow-lg ${index === currentVideoIndex
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/70'
                          }`}
                        aria-label={`Ir al video ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
