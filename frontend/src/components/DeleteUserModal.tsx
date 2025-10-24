'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteUser } from '@/hooks/use-user';
import type { User } from '@/types/user.types';

interface DeleteUserModalProps {
    user: User;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeleteUserModal({
    user,
    isOpen,
    onOpenChange,
}: DeleteUserModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const deleteUserMutation = useDeleteUser();

    const handleDelete = async () => {
        let loadingToast: string | undefined;
        try {
            setIsDeleting(true);
            loadingToast = toast.loading('Eliminando usuario y sus datos...');

            await deleteUserMutation.mutateAsync(user._id);

            toast.dismiss(loadingToast);
            toast.success('Usuario eliminado exitosamente');
            onOpenChange(false);
        } catch (error: any) {
            console.error('❌ Error al eliminar usuario:', error);

            // Cerrar el toast de loading antes de mostrar el error
            if (loadingToast) {
                toast.dismiss(loadingToast);
            }

            // Mostrar mensaje de error
            const errorMessage = error?.response?.data?.message || error?.message || 'Error al eliminar el usuario';
            toast.error(errorMessage, {
                duration: 5000,
                icon: '❌'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Confirmar Eliminación de Usuario</span>
                    </DialogTitle>
                    <div className="space-y-3 pt-4">
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="font-semibold text-red-900 dark:text-red-100 mb-2">
                                ⚠️ Esta acción es irreversible
                            </p>
                            <p className="text-sm text-red-800 dark:text-red-200">
                                Estás a punto de eliminar permanentemente al usuario:
                            </p>
                            <p className="font-bold text-red-900 dark:text-red-100 mt-2 text-center text-lg">
                                {user.name}
                            </p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <p className="font-semibold">Se eliminarán los siguientes datos:</p>
                            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                                <li>Cuenta de usuario</li>
                                <li>Todos los perfiles asociados</li>
                                <li>Verificaciones de perfil</li>
                                <li>Facturas e historial de pagos</li>
                                <li>Asignaciones de planes</li>
                                <li>Cualquier otro dato relacionado</li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <p className="text-sm text-yellow-900 dark:text-yellow-100">
                                <strong>Nota:</strong> Esta operación no se puede deshacer. Asegúrate de que realmente deseas continuar.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Eliminando...' : 'Eliminar Usuario'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
