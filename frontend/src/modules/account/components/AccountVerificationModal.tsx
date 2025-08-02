'use client';

import {
    AlertTriangle,
    Camera,
    CheckCircle,
    Clock,
    Info,
    Shield,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useUpdateUser } from '@/hooks/use-user';
import type { User } from '@/types/user.types';
import { uploadMultipleImages } from '@/utils/tools';

interface AccountVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    verification_in_progress: boolean;
    userId: string;
}

export default function AccountVerificationModal({
    isOpen,
    onClose,
    verification_in_progress,
    userId,
}: AccountVerificationModalProps) {
    const [loading, setLoading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState({
        image1: null as File | null,
        image2: null as File | null,
        image3: null as File | null,
    });
    const { mutate: updateUserMutation } = useUpdateUser();

    const handleFileUpload = (fileType: 'image1' | 'image2' | 'image3', file: File) => {
        setUploadedFiles((prev) => ({
            ...prev,
            [fileType]: file,
        }));
    };

    const handleSubmitVerification = () => {
        toast.loading('Subiendo imagenes...');
        if (uploadedFiles.image1 && uploadedFiles.image2 && uploadedFiles.image3) {
            setLoading(true);
            uploadMultipleImages([uploadedFiles.image1, uploadedFiles.image2, uploadedFiles.image3])
                .then((urls) => {
                    const filteredUrls = urls.filter(
                        (url): url is string => url !== null,
                    );
                    const data: Partial<User> = {
                        verificationDocument: filteredUrls,
                        verification_in_progress: true,
                    };
                    updateUserMutation({
                        userId,
                        data,
                    });
                    setLoading(false);
                    setShowUploadForm(false);
                    toast.dismiss();
                    toast.success('Imagenes subidas con exito');
                    onClose();
                })
                .catch((error) => {
                    console.error('Error al subir las imagenes:', error);
                    setLoading(false);
                    toast.dismiss();
                    toast.error('Error al subir las imagenes');
                });
        }
    };

    const canSubmit = uploadedFiles.image1 && uploadedFiles.image2 && uploadedFiles.image3;

    const handleClose = () => {
        setShowUploadForm(false);
        setUploadedFiles({ image1: null, image2: null, image3: null });
        onClose();
    };

    if (verification_in_progress) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <VisuallyHidden>
                        <DialogTitle>Verificación en Progreso</DialogTitle>
                    </VisuallyHidden>
                    <div className="text-center p-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-4">
                            Verificación en Progreso
                        </h2>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            Su cuenta está siendo verificada. Este proceso puede tomar entre
                            24-48 horas. Le notificaremos por email una vez que la
                            verificación esté completa.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Tiempo estimado:</strong> 24-48 horas
                                <br />
                                <strong>Estado:</strong> En revisión
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (showUploadForm) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="text-center pb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            Verificación de Identidad
                        </DialogTitle>
                        <p className="text-muted-foreground">
                            Sube los documentos requeridos para verificar tu identidad
                        </p>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Imagen 1 */}
                            <div className="space-y-3">
                                <Label className="text-foreground font-medium">
                                    Documento de Identidad (Frente)
                                </Label>
                                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('image1', file);
                                        }}
                                        className="hidden"
                                        id="image1-upload"
                                    />
                                    <label htmlFor="image1-upload" className="cursor-pointer">
                                        {uploadedFiles.image1 ? (
                                            <div className="space-y-2">
                                                <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                                                <p className="text-sm text-foreground font-medium">
                                                    {uploadedFiles.image1.name}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    Archivo cargado correctamente
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">
                                                    Subir Imagen 1
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG hasta 10MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Imagen 2 */}
                            <div className="space-y-3">
                                <Label className="text-foreground font-medium">
                                    Documento de Identidad (Reverso)
                                </Label>
                                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('image2', file);
                                        }}
                                        className="hidden"
                                        id="image2-upload"
                                    />
                                    <label htmlFor="image2-upload" className="cursor-pointer">
                                        {uploadedFiles.image2 ? (
                                            <div className="space-y-2">
                                                <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                                                <p className="text-sm text-foreground font-medium">
                                                    {uploadedFiles.image2.name}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    Archivo cargado correctamente
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">
                                                    Subir Imagen 2
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG hasta 10MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Imagen 3 */}
                            <div className="space-y-3">
                                <Label className="text-foreground font-medium">
                                    Foto de rostro con documento y cartel
                                </Label>
                                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-3">
                                    <div className="flex items-start space-x-2">
                                        <Info className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            Foto de rostro con documento y cartel con el nombre del perfil y fecha de la solicitud de inscripción registrada en el sistema (el mismo documento de la foto de solo documento).
                                        </p>
                                    </div>
                                </div>
                                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('image3', file);
                                        }}
                                        className="hidden"
                                        id="image3-upload"
                                    />
                                    <label htmlFor="image3-upload" className="cursor-pointer">
                                        {uploadedFiles.image3 ? (
                                            <div className="space-y-2">
                                                <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                                                <p className="text-sm text-foreground font-medium">
                                                    {uploadedFiles.image3.name}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    Archivo cargado correctamente
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Camera className="h-8 w-8 mx-auto text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">
                                                    Subir Imagen 3
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG hasta 10MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start space-x-3">
                                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                        Requisitos importantes:
                                    </h4>
                                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                        <li>• Las imágenes deben ser claras y legibles</li>
                                        <li>• Documento de identidad válido y vigente</li>
                                        <li>• La foto con rostro debe incluir el documento y un cartel con nombre del perfil y fecha</li>
                                        <li>• No se aceptan capturas de pantalla</li>
                                        <li>• El proceso de verificación toma 24-48 horas</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowUploadForm(false)}
                                className="flex-1 hover:bg-muted/50 transition-colors duration-200"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmitVerification}
                                disabled={!canSubmit || loading}
                                className={`flex-1 transition-all duration-200 ${
                                    canSubmit
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105'
                                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                                }`}
                            >
                                Enviar a Verificación
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <VisuallyHidden>
                    <DialogTitle>Verificación Requerida</DialogTitle>
                </VisuallyHidden>
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                        Verificación Requerida
                    </h2>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                        La verificación nos ayuda a mantener la seguridad y confianza en nuestra plataforma.
                    </p>
                    <Button
                        onClick={() => setShowUploadForm(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/25"
                    >
                        <Shield className="h-4 w-4 mr-2" />
                        Ir a Verificar
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                        El proceso de verificación es gratuito y toma solo unos minutos
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}