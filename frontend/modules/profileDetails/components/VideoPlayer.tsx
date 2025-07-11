import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function VideoPlayer({ images }: { images: string }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  return (
    <Card className="bg-card border-border animate-in fade-in-50 slide-in-from-right-10 duration-1000">
      <CardContent className="p-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
          <Image
            width={600}
            height={400}
            src={images || '/placeholder.svg'}
            alt="Video preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Button
              size="lg"
              className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-white/30"
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
            >
              {isVideoPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              className="bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsVideoMuted(!isVideoMuted)}
            >
              {isVideoMuted ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
