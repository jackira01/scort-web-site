import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Eye, Instagram, Facebook, Twitter, ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUpdateUser } from '@/hooks/use-user';
import toast from 'react-hot-toast';
import type { User } from '@/types/user.types';

interface UserDocumentVerificationModalProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDocumentVerificationModal = ({
  user,
  isOpen,
  onOpenChange,
}: UserDocumentVerificationModalProps) => {
  const [userVerificationStatus, setUserVerificationStatus] = useState(user.isVerified);
  const updateUserMutation = useUpdateUser();

  const handleUserVerificationToggle = async (checked: boolean) => {
    try {
      console.log(`🔄 Intentando actualizar verificación de usuario ${user._id} a:`, checked);

      // Optimistic update
      setUserVerificationStatus(checked);

      // Call the mutation with explicit data structure
      const result = await updateUserMutation.mutateAsync({
        userId: user._id,
        data: {
          isVerified: checked,
        },
      });

      console.log('📡 Respuesta del servidor:', result);

      // Verify the update was successful - handle both old and new response formats
      const isVerifiedValue = result?.isVerified ?? result?.data?.isVerified;
      const success = result?.success !== false; // Default to true if success field is not present

      if (success && typeof isVerifiedValue === 'boolean') {
        // Update local state to match server response
        setUserVerificationStatus(isVerifiedValue);

        console.log(`✅ Actualización exitosa. Nuevo estado: ${isVerifiedValue}`);

        toast.success(
          isVerifiedValue
            ? 'Usuario verificado exitosamente'
            : 'Verificación de usuario removida'
        );
      } else {
        // If no proper response or explicit failure, revert
        console.warn('⚠️ Respuesta inválida del servidor:', result);
        setUserVerificationStatus(!checked);
        toast.error(result?.message || 'Error: Respuesta inválida del servidor');
      }
    } catch (error) {
      console.error('❌ Error updating user verification:', error);

      // Revert optimistic update on error
      setUserVerificationStatus(!checked);

      // Extract error message from different possible error structures
      let errorMessage = 'Error al actualizar el estado de verificación';

      if (error && typeof error === 'object') {
        const err = error as any;
        errorMessage = err?.response?.data?.message ||
          err?.message ||
          errorMessage;
      }

      toast.error(errorMessage);
    }
  };

  const handleDocumentView = (documentUrl: string) => {
    window.open(documentUrl, '_blank');
  };

  const handleDocumentDownload = (documentUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = `documento_verificacion_${user.name}_${index + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Verificación de Documentos - {user.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Verification Toggle */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <Label className="text-base font-semibold">
                      Estado de Verificación del Usuario
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">
                    Controla si el usuario está verificado en el sistema
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={userVerificationStatus ? 'default' : 'secondary'}
                    className={
                      userVerificationStatus
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200 dark:border-red-800'
                    }
                  >
                    {updateUserMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Actualizando...
                      </>
                    ) : userVerificationStatus ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verificado
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No Verificado
                      </>
                    )}
                  </Badge>
                  <Switch
                    checked={userVerificationStatus}
                    onCheckedChange={handleUserVerificationToggle}
                    disabled={updateUserMutation.isPending}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Social Media Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Redes Sociales</h3>
            </div>

            {(() => {
              // Obtener el primer perfil activo del usuario
              const activeProfile = user.profiles?.find(profile => profile.isActive);
              const socialMedia = activeProfile?.socialMedia;

              return socialMedia && (
                socialMedia.instagram ||
                socialMedia.facebook ||
                socialMedia.tiktok ||
                socialMedia.twitter ||
                socialMedia.onlyFans
              ) ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {socialMedia.instagram && (
                    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-pink-500">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 rounded-lg">
                            <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">Instagram</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {socialMedia.instagram}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(socialMedia.instagram, '_blank')}
                            className="shrink-0 hover:bg-pink-50 hover:border-pink-300 dark:hover:bg-pink-900/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {socialMedia.facebook && (
                    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">Facebook</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {socialMedia.facebook}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(socialMedia.facebook, '_blank')}
                            className="shrink-0 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {socialMedia.tiktok && (
                    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-gray-500">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <ExternalLink className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">TikTok</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {socialMedia.tiktok}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(socialMedia.tiktok, '_blank')}
                            className="shrink-0 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {socialMedia.twitter && (
                    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-sky-500">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-sky-100 dark:bg-sky-900 rounded-lg">
                            <Twitter className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">Twitter</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {socialMedia.twitter}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(socialMedia.twitter, '_blank')}
                            className="shrink-0 hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-sky-900/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {socialMedia.onlyFans && (
                    <Card className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <ExternalLink className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">OnlyFans</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {socialMedia.onlyFans}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(socialMedia.onlyFans, '_blank')}
                            className="shrink-0 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-900/20"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="p-8 text-center">
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
                        <ExternalLink className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="font-medium text-gray-600 dark:text-gray-400">
                        No hay redes sociales configuradas
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Este usuario no ha configurado ninguna red social en su perfil
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          <Separator />

          {/* Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Documentos de Verificación</h3>
            </div>

            {user.verificationDocument && user.verificationDocument.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.verificationDocument.map((documentUrl, index) => (
                  <Card key={index} className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">
                            Documento {index + 1}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Documento de verificación subido por el usuario
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentView(documentUrl)}
                          className="flex-1 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentDownload(documentUrl, index)}
                          className="flex-1 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-600 dark:text-gray-400">
                      No hay documentos disponibles
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Este usuario no ha subido documentos de verificación
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDocumentVerificationModal;