'use client';

import {
    AlertTriangle,
    Camera,
    CheckCircle,
    Clock,
    Info,
    Shield,
    Settings,
    FileText,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { useUpdateUser, useUser } from '@/hooks/use-user';
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
    const { data: user } = useUser();

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
                    // Error al subir las imagenes
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

    // Si el usuario está verificado, mostrar panel de administración
    if (user?.isVerified && !showUploadForm) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Cuenta Verificada
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 p-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                ¡Tu cuenta está verificada!
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Tu identidad ha sido confirmada y tu cuenta está completamente verificada.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <div>
                                            <p className="font-medium text-green-800 dark:text-green-200">
                                                Verificación Completa
                                            </p>
                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                Todos tus documentos han sido aprobados
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <Button
                                    onClick={() => setShowUploadForm(true)}
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Actualizar Documentos
                                </Button>

                                {/* <Button
                                    onClick={handleClose}
                                    variant="outline"
                                    className="w-full justify-start"
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Ver Estado de Verificación
                                </Button> */}
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                                Si necesitas actualizar tu información de verificación, puedes subir nuevos documentos.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

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
                            {/* Imagen 1: Documento de Identidad (Frente) */}
                            <div className="space-y-3">
                                <Label className="text-foreground font-medium">
                                    Documento de Identidad (Frente)
                                </Label>
                                
                                {/* Imagen de referencia */}
                                <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                        📋 Ejemplo de referencia:
                                    </p>
                                    <div className="flex justify-center">
                                        <img 
                                            src="/images/documento frontal.png" 
                                            alt="Ejemplo de documento frontal" 
                                            className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 text-center">
                                        Foto clara del frente del documento de identidad
                                    </p>
                                </div>

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
                                                    Subir documento (frente)
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG hasta 10MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Imagen 2: Video o Foto de Verificación con Cartel */}
                            <div className="space-y-3">
                                <Label className="text-foreground font-medium">
                                    Video o Foto de Verificación con Cartel
                                </Label>

                                {/* Imagen de referencia */}
                                <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                        📋 Ejemplo de referencia:
                                    </p>
                                    <div className="flex justify-center">
                                        <img 
                                            src="/images/perfil con cartel.png" 
                                            alt="Ejemplo de foto con cartel" 
                                            className="max-w-full h-auto max-h-48 rounded-lg border border-blue-300"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 text-center">
                                        La persona debe sostener un cartel con su nombre y la fecha
                                    </p>
                                </div>

                                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-purple-500 transition-colors duration-200 cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
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
                                                    Subir video o foto con cartel
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    JPG, PNG, MP4, MOV hasta 50MB
                                                </p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Imagen 3: Foto con Documento al Lado del Rostro */}
                            <div className="space-y-3">
                                <Label className="text-foreground font-medium">
                                    Foto con Documento al Lado del Rostro
                                </Label>

                                {/* Imagen de referencia */}
                                <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                        📋 Ejemplo de referencia:
                                    </p>
                                    <div className="flex justify-center">
                                        <img 
                                            src="/images/rostro con documento.png" 
                                            alt="Ejemplo de rostro con documento" 
                                            className="max-w-full h-auto max-h-48 rounded-lg border border-blue-300"
                                        />
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 text-center">
                                        Sostén tu documento al lado de tu rostro (mismo documento de la foto frontal)
                                    </p>
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
                                                    Subir foto con documento
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
                                        <li>• Las imágenes/videos deben ser claras y legibles</li>
                                        <li>• Documento de identidad válido y vigente</li>
                                        <li>• El video/foto de verificación debe incluir un cartel con tu nombre y fecha</li>
                                        <li>• La foto con documento debe mostrar claramente tu rostro y el documento</li>
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
                                className={`flex-1 transition-all duration-200 ${canSubmit
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