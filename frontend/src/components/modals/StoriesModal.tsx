'use client';

import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Story {
  link: string;
  type: 'image' | 'video';
  timestamp?: string;
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

  const currentProfile = profiles[currentProfileIndex];
  const currentStory = currentProfile?.stories[currentStoryIndex];
  const storyDuration = 5000; // 5 segundos por historia

  useEffect(() => {
    if (!isOpen || isPaused) return;

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
  }, [isOpen, isPaused, currentProfileIndex, currentStoryIndex]);

  const nextStory = () => {
    if (currentStoryIndex < currentProfile.stories.length - 1) {
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
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const prevProfile = () => {
    if (currentProfileIndex > 0) {
      setCurrentProfileIndex(currentProfileIndex - 1);
      setCurrentStoryIndex(
        profiles[currentProfileIndex - 1].stories.length - 1,
      );
      setProgress(0);
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

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
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
            <p className="text-white font-semibold text-sm">
              {currentProfile.name}
            </p>
            <p className="text-white/70 text-xs">{currentStory.timestamp}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="text-white hover:bg-white/20"
          >
            {isPaused ? (
              <Play className="h-5 w-5" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation areas */}
      <div className="absolute inset-0 flex">
        {/* Left half - previous story */}
        <div
          className="flex-1 cursor-pointer flex items-center justify-start pl-4"
          onClick={prevStory}
        >
          {(currentStoryIndex > 0 || currentProfileIndex > 0) && (
            <ChevronLeft className="h-8 w-8 text-white/50 hover:text-white transition-colors" />
          )}
        </div>

        {/* Right half - next story */}
        <div
          className="flex-1 cursor-pointer flex items-center justify-end pr-4"
          onClick={nextStory}
        >
          <ChevronRight className="h-8 w-8 text-white/50 hover:text-white transition-colors" />
        </div>
      </div>

      {/* Story content */}
      <div className="relative w-full max-w-md h-full max-h-[80vh] flex items-center justify-center">
        {currentStory.type === 'image' ? (
          <Image
            src={currentStory.link}
            alt="Historia"
            width={400}
            height={600}
            className="w-full h-auto max-h-full object-contain rounded-lg"
            priority
          />
        ) : (
          <video
            src={currentStory.link}
            className="w-full h-auto max-h-full rounded-lg"
            autoPlay
            muted
            onEnded={nextStory}
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
