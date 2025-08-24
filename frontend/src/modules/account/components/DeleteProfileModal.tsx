import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ProfileResponse {
  _id: string;
  user: string;
  name: string;
  location: {
    country: { value: string; label: string } | string;
    department: { value: string; label: string } | string;
    city: { value: string; label: string } | string;
  };
  age: string;
  verification: {
    _id: string;
    verificationStatus: string;
    verificationProgress: number;
  };
  media?: {
    gallery?: string[];
    videos?: string[];
    audios?: string[];
    stories?: { _id: string; link: string; type: 'image' | 'video' }[];
  };
}

interface DeleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: ProfileResponse | null;
  isDeleting: boolean;
}

export default function DeleteProfileModal({
  isOpen,
  onClose,
  onConfirm,
  profile,
  isDeleting,
}: DeleteProfileModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Perfil
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Esta acción no se puede deshacer. El perfil será eliminado permanentemente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ¿Estás seguro de que deseas eliminar el perfil{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{profile?.name}"
            </span>?
          </p>
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300">
              • Se eliminarán todas las fotos, videos y contenido asociado
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              • Se perderán todos los datos del perfil
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              • Esta acción es irreversible
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar Perfil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}