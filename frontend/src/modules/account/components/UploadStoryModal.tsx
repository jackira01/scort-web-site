'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
    Image as ImageIcon,
    Loader2,
    Play,
    Trash2,
    Upload,
    Video,
    X,
} from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { getProfileById, updateProfile } from '@/services/user.service';
import { uploadMultipleImages, uploadMultipleVideos } from '@/utils/tools';

interface UploadStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    profileId: string;
    profileName: string;
    currentStories?: { _id: string; link: string; type: 'image' | 'video' }[];
}

interface StoryFile {
    id: string;
    file: File;
    type: 'image' | 'video';
    preview: string;
}

export default function UploadStoryModal({
    isOpen,
    onClose,
    profileId,
    profileName,
    currentStories = [],
}: UploadStoryModalProps) {

    const [selectedFiles, setSelectedFiles] = useState<StoryFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [deletingStory, setDeletingStory] = useState<string | null>(null);
    const [previewStory, setPreviewStory] = useState<{
        link: string;
        type: 'image' | 'video';
    } | null>(null);
    const queryClient = useQueryClient();
    const { data: session } = useSession();



    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        files.forEach((file) => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                toast.error('Solo se permiten archivos de imagen o video');
                return;
            }

            // Validar tamaño (máximo 50MB para videos, 10MB para imágenes)
            const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                toast.error(
                    `El archivo es demasiado grande. Máximo ${isVideo ? '50MB' : '10MB'}`,
                );
                return;
            }

            const preview = URL.createObjectURL(file);
            const newStoryFile: StoryFile = {
                id: Math.random().toString(36).substr(2, 9),
                file,
                type: isImage ? 'image' : 'video',
                preview,
            };

            setSelectedFiles((prev) => [...prev, newStoryFile]);
        });

        // Limpiar el input
        event.target.value = '';
    };

    const removeFile = (id: string) => {
        setSelectedFiles((prev) => {
            const fileToRemove = prev.find((f) => f.id === id);
            if (fileToRemove) {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('Selecciona al menos un archivo');
            return;
        }

        setUploading(true);

        try {
            const imageFiles = selectedFiles
                .filter((f) => f.type === 'image')
                .map((f) => f.file);
            const videoFiles = selectedFiles
                .filter((f) => f.type === 'video')
                .map((f) => f.file);

            let uploadedStories: { link: string; type: 'image' | 'video' }[] = [];

            // Subir imágenes
            if (imageFiles.length > 0) {
                toast.loading('Subiendo imágenes...');
                const imageUrls = await uploadMultipleImages(imageFiles);
                const imageStories = imageUrls
                    .filter((url): url is string => url !== null)
                    .map((url) => ({ link: url, type: 'image' as const }));
                uploadedStories = [...uploadedStories, ...imageStories];
                toast.dismiss();
            }

            // Subir videos
            if (videoFiles.length > 0) {
                toast.loading('Subiendo videos...');
                const videoResults = await uploadMultipleVideos(videoFiles);
                const videoStories = videoResults.map((result) => ({ 
                    link: result.link, 
                    type: 'video' as const 
                }));
                uploadedStories = [...uploadedStories, ...videoStories];
                toast.dismiss();
            }

            if (uploadedStories.length === 0) {
                throw new Error('No se pudieron subir los archivos');
            }

            // Combinar historias existentes con las nuevas
            const allStories = [...currentStories, ...uploadedStories];

            // Obtener el perfil completo para preservar todos los datos de media
            toast.loading('Obteniendo datos del perfil...');
            const fullProfile = await getProfileById(profileId);

            // Actualizar el perfil con las nuevas historias preservando otros datos
            toast.loading('Actualizando perfil...');
            await updateProfile(profileId, {
                media: {
                    gallery: fullProfile.media?.gallery || [],
                    videos: fullProfile.media?.videos || [],
                    audios: fullProfile.media?.audios || [],
                    stories: allStories,
                },
            });

            // Invalidar queries para refrescar los datos
            if (session?.user?._id) {
                await queryClient.invalidateQueries({
                    queryKey: ['userProfiles', session.user._id],
                });
                await queryClient.invalidateQueries({
                    queryKey: ['profileDetails', profileId],
                });
            }

            toast.dismiss();
            toast.success(
                `${uploadedStories.length} historia${uploadedStories.length > 1 ? 's' : ''} subida${uploadedStories.length > 1 ? 's' : ''} exitosamente`,
            );

            // Limpiar archivos seleccionados
            selectedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
            setSelectedFiles([]);
            onClose();
        } catch (error: unknown) {
            toast.dismiss();
            toast.error('Error al subir las historias');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteExistingStory = async (storyId: string) => {
        try {
            setDeletingStory(storyId);

            // Obtener el perfil completo para preservar todos los datos de media
            toast.loading('Obteniendo datos del perfil...');
            const fullProfile = await getProfileById(profileId);

            // Filtrar la historia a eliminar por _id
            const updatedStories = (fullProfile.media?.stories || []).filter(
                (story: { _id?: string; link: string; type: 'image' | 'video' }) => story._id !== storyId,
            );

            // Actualizar el perfil preservando todos los datos de media
            toast.loading('Eliminando historia...');
            await updateProfile(profileId, {
                media: {
                    gallery: fullProfile.media?.gallery || [],
                    videos: fullProfile.media?.videos || [],
                    audios: fullProfile.media?.audios || [],
                    stories: updatedStories,
                },
            });

            // Invalidar queries para refrescar los datos
            if (session?.user?._id) {
                await queryClient.invalidateQueries({
                    queryKey: ['userProfiles', session.user._id],
                });
            }

            toast.success('Historia eliminada correctamente');

            // Recargar la página para mostrar los cambios
            window.location.reload();
        } catch (error: unknown) {
            toast.error('Error al eliminar la historia');
        } finally {
            setDeletingStory(null);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            // Limpiar URLs de preview
            selectedFiles.forEach((file) => URL.revokeObjectURL(file.preview));
            setSelectedFiles([]);
            onClose();
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <Upload className="h-5 w-5" />
                            <span>Subir Historias - {profileName}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Área de selección de archivos */}
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex space-x-2">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                    <Video className="h-8 w-8 text-muteground" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium">
                                        Selecciona imágenes o videos
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Máximo 10MB para imágenes, 50MB para videos
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="story-upload"
                                    disabled={uploading}
                                />
                                <label htmlFor="story-upload">
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer"
                                        disabled={uploading}
                                        asChild
                                    >
                                        <span>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Seleccionar Archivos
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        </div>

                        {/* Vista previa de archivos seleccionados */}
                        {selectedFiles.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-medium">
                                    Archivos seleccionados ({selectedFiles.length})
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedFiles.map((storyFile) => (
                                        <Card key={storyFile.id} className="relative group">
                                            <CardContent className="p-2">
                                                <div className="relative aspect-square rounded-lg overflow-hidden">
                                                    {storyFile.type === 'image' ? (
                                                        <Image
                                                            width={200}
                                                            height={200}
                                                            src={storyFile.preview}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={storyFile.preview}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => removeFile(storyFile.id)}
                                                        disabled={uploading}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {storyFile.type === 'image' ? 'Imagen' : 'Video'}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {(storyFile.file.size / (1024 * 1024)).toFixed(1)}MB
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Historias actuales */}
                        {currentStories.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-medium">
                                    Historias actuales ({currentStories.length})
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {currentStories.map((story, index) => (
                                        <Card key={story._id || index} className="relative group">
                                            <CardContent className="p-2">
                                                <div
                                                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                                                    onClick={() => setPreviewStory(story)}
                                                >
                                                    {story.type === 'image' ? (
                                                        <Image
                                                            width={200}
                                                            height={200}
                                                            src={story.link}
                                                            alt={`Historia ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <>
                                                            <video
                                                                src={story.link}
                                                                className="w-full h-full object-cover"
                                                                muted
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <Play className="h-8 w-8 text-white drop-shadow-lg" />
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteExistingStory(story._id);
                                                        }}
                                                        disabled={deletingStory === story._id}
                                                    >
                                                        {deletingStory === story._id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                                <div className="mt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {story.type === 'image' ? 'Imagen' : 'Video'}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={uploading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={selectedFiles.length === 0 || uploading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Subir {selectedFiles.length} Historia
                                        {selectedFiles.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de previsualización de historia */}
            {previewStory && (
                <Dialog
                    open={!!previewStory}
                    onOpenChange={() => setPreviewStory(null)}
                >
                    <DialogContent className="max-w-2xl max-h-[90vh] p-0">
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => setPreviewStory(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center justify-center bg-black rounded-lg">
                                {previewStory.type === 'image' ? (
                                    <Image
                                        width={200}
                                        height={200}
                                        src={previewStory.link}
                                        alt="Vista previa de historia"
                                        className="max-w-full max-h-[80vh] object-contain"
                                    />
                                ) : (
                                    <video
                                        src={previewStory.link}
                                        controls
                                        className="max-w-full max-h-[80vh] object-contain"
                                        autoPlay
                                    />
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
