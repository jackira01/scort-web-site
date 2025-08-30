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
import { FileText, Download, Eye } from 'lucide-react';
import { useUpdateUser } from '@/hooks/use-user';
import { toast } from 'sonner';
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    Estado de Verificación del Usuario
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Controla si el usuario está verificado en el sistema
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={userVerificationStatus ? 'default' : 'secondary'}
                    className={
                      userVerificationStatus
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                    }
                  >
                    {userVerificationStatus ? 'Verificado' : 'No Verificado'}
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

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documentos de Verificación</h3>

            {user.verificationDocument && user.verificationDocument.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {user.verificationDocument.map((documentUrl, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
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

                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentView(documentUrl)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDocumentDownload(documentUrl, index)}
                          className="flex-1"
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
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
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