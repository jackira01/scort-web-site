'use client'

import { Pause, Play, Volume2, VolumeX, Music } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  audios: string[];
}

export default function AudioPlayer({ audios }: AudioPlayerProps) {
  const safeAudios = audios || [];
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([1]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-play next audio if available
      if (currentAudioIndex < safeAudios.length - 1) {
        setCurrentAudioIndex(currentAudioIndex + 1);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAudioIndex, safeAudios.length]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.volume = value[0];
      setVolume(value);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAudioName = (audioUrl: string) => {
    const fileName = audioUrl.split('/').pop() || 'Audio';
    return fileName.split('.')[0];
  };

  if (!safeAudios || safeAudios.length === 0) {
    return (
      <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-10 duration-1000">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Music className="h-4 w-4" />
            Audios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">No hay audios disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-10 duration-1000">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Music className="h-4 w-4" />
          Audios ({safeAudios.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <audio
          ref={audioRef}
          src={safeAudios[currentAudioIndex]}
          preload="metadata"
        />
        
        {/* Current Audio Info */}
        <div className="text-center">
          <p className="text-sm font-medium truncate">
            {getAudioName(safeAudios[currentAudioIndex])}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentAudioIndex + 1} de {safeAudios.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Previous */}
          <Button
            size="sm"
            variant="ghost"
            disabled={currentAudioIndex === 0}
            onClick={() => setCurrentAudioIndex(Math.max(0, currentAudioIndex - 1))}
            className="h-8 w-8 p-0"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </Button>

          {/* Play/Pause */}
          <Button
            size="sm"
            onClick={handlePlayPause}
            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {/* Next */}
          <Button
            size="sm"
            variant="ghost"
            disabled={currentAudioIndex === safeAudios.length - 1}
          onClick={() => setCurrentAudioIndex(Math.min(safeAudios.length - 1, currentAudioIndex + 1))}
            className="h-8 w-8 p-0"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleMuteToggle}
            className="h-8 w-8 p-0"
          >
            {isMuted ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
          <Slider
            value={volume}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>

        {/* Audio List */}
        {safeAudios.length > 1 && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground">Lista de audios:</p>
            {safeAudios.map((audio, index) => (
              <button
                type="button"
                key={index}
                onClick={() => setCurrentAudioIndex(index)}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors duration-200 ${
                  index === currentAudioIndex
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}. {getAudioName(audio)}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}