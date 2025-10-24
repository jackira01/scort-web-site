'use client'

import { Maximize2, Pause, Play, Volume2, VolumeX, } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

interface VideoPlayerProps {
  videos: Array<{ link: string; preview: string } | string>;
}

export default function VideoPlayer({ videos }: VideoPlayerProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  // Función para obtener la URL del video
  const getVideoUrl = (video: { link: string; preview: string } | string): string => {
    return typeof video === 'string' ? video : video.link;
  };

  // Función para obtener la URL del preview
  const getPreviewUrl = (video: { link: string; preview: string } | string): string => {
    if (typeof video === 'string') {
      return '/placeholder.svg';
    }
    // Si preview está vacío o undefined, usar placeholder
    return video.preview && video.preview.trim() !== '' ? video.preview : '/placeholder.svg';
  };

  const currentVideoUrl = videos.length > 0 ? getVideoUrl(videos[currentVideoIndex]) : '';
  const currentPreviewUrl = videos.length > 0 ? getPreviewUrl(videos[currentVideoIndex]) : '/placeholder.svg';

  // Debug: Log para verificar preview
  // console.log('🎬 Video preview URL:', currentPreviewUrl);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
  };

  const handleModalVideoEnded = () => {
    // Video ended in modal
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoError(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setVideoError(false); // Reset error state when opening modal
    // Pausar el video principal cuando se abre el modal
    if (videoRef.current && isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const handleVideoChange = (index: number) => {
    setCurrentVideoIndex(index)
    setVideoError(false)
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
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer" onClick={openModal}>
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
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                  onLoadedData={handleVideoLoad}
                  poster={currentPreviewUrl}
                  preload="metadata"
                  playsInline
                  crossOrigin="anonymous"
                >
                  <source src={currentVideoUrl} type="video/mp4" />
                  <source src={currentVideoUrl} type="video/webm" />
                  <source src={currentVideoUrl} type="video/ogg" />
                  Tu navegador no soporta el elemento video.
                </video>
              </>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-3">
                <Button
                  size="lg"
                  className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                >
                  {isVideoPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
                <Button
                  size="lg"
                  className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal();
                  }}
                >
                  <Maximize2 className="h-6 w-6" />
                </Button>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                size="sm"
                variant="ghost"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMuteToggle();
                }}
              >
                {isVideoMuted ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            </div>
            {videos.length > 1 && (
              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="flex space-x-1">
                  {videos.map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-200 ${index === currentVideoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoChange(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para ver video en pantalla completa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[90vw] max-w-[95vw] w-full sm:max-h-[90vh] max-h-[85vh] p-0 bg-black border-0 flex items-center justify-center">
          <VisuallyHidden>
            <DialogTitle>Video Player Modal</DialogTitle>
          </VisuallyHidden>
          <div className="relative w-full h-full max-h-[85vh] flex items-center justify-center">
            {videoError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-800">
                <div className="text-6xl mb-4">📹</div>
                <p className="text-lg mb-2">Error al cargar el video</p>
                <p className="text-sm text-gray-300">El formato del video no es compatible</p>
              </div>
            ) : (
              <video
                ref={modalVideoRef}
                className="max-w-full max-h-full object-contain"
                muted={isVideoMuted}
                onEnded={handleModalVideoEnded}
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
            )}
            {videos.length > 1 && (
              <div className="absolute bottom-4 right-4 flex space-x-2">
                {videos.map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 ${index === currentVideoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    onClick={() => handleVideoChange(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
