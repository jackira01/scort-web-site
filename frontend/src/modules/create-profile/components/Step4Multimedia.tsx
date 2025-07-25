'use client';

import { Camera, Video, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormData } from '../types';

interface Step4MultimediaProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
}

export function Step4Multimedia({ formData, onChange }: Step4MultimediaProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-right-4 duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
          04
        </div>
        <h2 className="text-2xl font-bold text-foreground">Multimedia</h2>
      </div>

      <div className="space-y-6">
        {/* Photos Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">Mis fotos</CardTitle>
              <Badge variant="outline">{formData.photos.length} / 20</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">añadir nuevo</p>
            </div>
          </CardContent>
        </Card>

        {/* Videos Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">
                Mis videos
              </CardTitle>
              <Badge variant="outline">{formData.videos.length} / 8</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">añadir nuevo</p>
            </div>
          </CardContent>
        </Card>

        {/* Audio Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-foreground">
                Mis archivos de audio
              </CardTitle>
              <Badge variant="outline">{formData.audios.length} / 6</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
              <Mic className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">añadir nuevo</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
