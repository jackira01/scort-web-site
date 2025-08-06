'use client'

import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface VideoPlayerProps {
  videos: string[];
}

export default function VideoPlayer({ videos }: VideoPlayerProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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
    <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-10 duration-1000">
      <CardContent className="p-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
          <video
            ref={videoRef}
            src={videos[currentVideoIndex]}
            className="w-full h-full object-cover"
            muted={isVideoMuted}
            onEnded={handleVideoEnded}
            poster="/placeholder.svg"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="lg"
              className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30"
              onClick={handlePlayPause}
            >
              {isVideoPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              size="sm"
              variant="ghost"
              className="bg-black/50 hover:bg-black/70 text-white"
              onClick={handleMuteToggle}
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
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      index === currentVideoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    onClick={() => setCurrentVideoIndex(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
