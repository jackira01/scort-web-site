'use client';

import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Story {
  link: string;
  type: 'image' | 'video';
  timestamp?: string;
  duration?: number;
  startTime?: number;
}

interface ProfileWithStories {
  _id: string;
  name: string;
  media?: {
    gallery?: string[];
    videos?: string[];
    audios?: string[];
    stories?: Story[];
  };
  stories: Story[];
  hasNewStories: boolean;
}

interface StoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: ProfileWithStories[];
  initialProfileIndex: number;
  initialStoryIndex?: number;
}

const StoriesModal = ({
  isOpen,
  onClose,
  profiles,
  initialProfileIndex,
  initialStoryIndex = 0,
}: StoriesModalProps) => {
  const [currentProfileIndex, setCurrentProfileIndex] =
    useState(initialProfileIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [imageSize, setImageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (imageSize.w && imageSize.h) {
      setOrientation(imageSize.w > imageSize.h ? 'horizontal' : 'vertical');
    }
  }, [imageSize]);

  const currentProfile = profiles[currentProfileIndex];
  const currentStory = currentProfile?.stories[currentStoryIndex];
  
  const storyDuration = currentStory?.type === 'video' 
    ? (currentStory.duration || 60) * 1000 
    : 5000;

  useEffect(() => {
    if (!isOpen || isPaused) return; 
    
    if (currentStory?.type === 'video') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + 100 / (storyDuration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, currentProfileIndex, currentStoryIndex, currentStory?.type, storyDuration]);

  useEffect(() => {
    if (currentStory?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = currentStory.startTime || 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentStoryIndex, currentProfileIndex]);

  const nextStory = () => {
    if (currentProfile?.stories && currentStoryIndex < currentProfile.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      nextProfile();
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else {
      prevProfile();
    }
  };

  const nextProfile = () => {
    if (profiles && currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevProfile = () => {
    if (profiles && currentProfileIndex > 0) {
      setCurrentProfileIndex(currentProfileIndex - 1);
      setCurrentStoryIndex(
        profiles[currentProfileIndex - 1]?.stories?.length ? profiles[currentProfileIndex - 1].stories.length - 1 : 0,
      );
      setProgress(0);
    }
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isPaused) return;
    
    const video = e.currentTarget;
    const start = currentStory.startTime || 0;
    const duration = currentStory.duration || 60;
    const end = start + duration;
    
    const relativeTime = Math.max(0, video.currentTime - start);
    const pct = Math.min(100, (relativeTime / duration) * 100);
    
    setProgress(pct);

    if (video.currentTime >= end) {
      nextStory();
    }
  };

  if (!isOpen || !currentProfile || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {currentProfile.stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width:
                  index === currentStoryIndex
                    ? `${progress}%`
                    : index < currentStoryIndex
                      ? '100%'
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20 story-header-buttons">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage
              src={currentProfile.media?.gallery?.[0]}
              alt={currentProfile.name}
            />
            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              {currentProfile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">{currentProfile.name}</p>
            <p className="text-white/70 text-xs">{currentStory.timestamp}</p>
          </div>
        </div>

        {/* BOTONES PAUSAR / CERRAR */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
                const newPaused = !isPaused;
                setIsPaused(newPaused);
                if (currentStory.type === 'video' && videoRef.current) {
                    if (newPaused) videoRef.current.pause();
                    else videoRef.current.play();
                }
            }}
            className="text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-transform hover:scale-110"
          >
            {isPaused ? (
              <Play className="h-6 w-6" />
            ) : (
              <Pause className="h-6 w-6" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onClose}
            className="text-white bg-black/40 hover:bg-black/60 rounded-full p-3 transition-transform hover:scale-110"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* NAVIGATION AREAS */}
      <div className="absolute inset-0 flex z-10">
        {/* Área izquierda - historia anterior */}
        <div
          className="flex-1 cursor-pointer"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.story-header-buttons')) return;
            prevStory();
          }}
        />

        {/* Área derecha - historia siguiente */}
        <div
          className="flex-1 cursor-pointer"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.story-header-buttons')) return;
            nextStory();
          }}
        />
      </div>

      {/* FLECHAS DE NAVEGACIÓN (solo visuales, no bloquean clics) */}
      <div
        className={`absolute inset-0 flex items-center px-6 z-20 pointer-events-none ${currentStoryIndex > 0 || currentProfileIndex > 0
            ? 'justify-between'
            : 'justify-end'
          }`}
      >
        {/* Flecha izquierda (solo si hay historia anterior) */}
        {(currentStoryIndex > 0 || currentProfileIndex > 0) && (
          <div className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-3 rounded-full transition-transform hover:scale-110 pointer-events-auto">
            <ChevronLeft
              className="h-10 w-10 text-white cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                prevStory();
              }}
            />
          </div>
        )}

        {/* Flecha derecha */}
        <div className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-3 rounded-full transition-transform hover:scale-110 pointer-events-auto">
          <ChevronRight
            className="h-10 w-10 text-white cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
          />
        </div>
      </div>


      {/* Story content */}
      <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center overflow-hidden">
        {currentStory.type === 'image' ? (
          <Image
            src={currentStory.link}
            alt="Historia"
            width={1200}
            height={800}
            priority
            className={`max-w-full h-auto rounded-lg transition-all duration-300 ${orientation === 'horizontal'
              ? 'object-cover max-h-[90vh]'
              : 'object-contain max-h-[90vh]'
              }`}
            onLoad={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              // Guardamos dimensiones, no cambiamos estado directo
              setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.link}
            className="max-w-full h-auto max-h-[90vh] rounded-lg object-contain"
            autoPlay
            muted
            onEnded={nextStory}
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={(e) => {
                if (currentStory.startTime) {
                    e.currentTarget.currentTime = currentStory.startTime;
                }
            }}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
          />
        )}
      </div>

      {/* Profile navigation dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {profiles.map((_, index) => (
          <button
            type="button"
            key={index}
            onClick={() => {
              setCurrentProfileIndex(index);
              setCurrentStoryIndex(0);
              setProgress(0);
            }}
            className={`w-2 h-2 rounded-full transition-colors ${index === currentProfileIndex ? 'bg-white' : 'bg-white/50'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default StoriesModal;
