import toast from 'react-hot-toast';
import { FileType, FILE_VALIDATION_CONFIG } from '../types';

export const extractFilesFromList = (files: FileList | null, event?: React.ChangeEvent<HTMLInputElement>): File[] => {
    if (!files) return [];

    let fileArray: File[] = [];

    // Método estándar
    try {
        const standardArray = Array.from(files);
        if (standardArray.length > 0 && standardArray.every(f => f instanceof File)) {
            fileArray = standardArray;
            return fileArray;
        }
    } catch (e) {
        console.log('⚠️ Método estándar falló');
    }

    // Método DataTransfer
    if (fileArray.length === 0 && event?.target) {
        try {
            const input = event.target as HTMLInputElement;
            const dt = new DataTransfer();

            if (input.files) {
                for (let i = 0; i < input.files.length; i++) {
                    const file = input.files.item(i);
                    if (file) {
                        dt.items.add(file);
                        fileArray.push(file);
                    }
                }
            }
        } catch (e) {
            console.error('❌ Método DataTransfer falló:', e);
        }
    }

    // Último intento: iteración manual
    if (fileArray.length === 0 && files) {
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files.item(i);
                if (file && file instanceof File) {
                    fileArray.push(file);
                }
            }
        } catch (e) {
            console.error('❌ Iteración manual falló:', e);
        }
    }

    return fileArray;
};

export const validateFileTypes = (files: File[], type: FileType): boolean => {
    const config = FILE_VALIDATION_CONFIG[type];
    const invalidFiles = files.filter((file) => !config.validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
        toast.error(`Tipo de archivo no válido. Solo: ${config.validTypes.join(', ')}`);
        return false;
    }

    return true;
};

export const validateFileSize = (files: File[], type: FileType): boolean => {
    const config = FILE_VALIDATION_CONFIG[type];

    if (!config.maxSize) return true;

    const oversizedFiles = files.filter((file) => file.size > config.maxSize!);

    if (oversizedFiles.length > 0) {
        toast.error(`Archivo muy grande. Máximo ${config.maxSize / 1024 / 1024}MB`);
        return false;
    }

    return true;
};

export const validateFileLimits = (
    currentCount: number,
    newCount: number,
    limit: number,
    type: FileType,
    planName?: string
): boolean => {
    if (currentCount + newCount > limit) {
        const typeLabel = type === 'photos' ? 'fotos' : type === 'videos' ? 'videos' : 'audios';
        toast(
            `Límite alcanzado: ${planName || 'tu plan actual'} permite máximo ${limit} ${typeLabel}. Actualmente tienes ${currentCount}.`,
            { duration: 5000 }
        );
        return false;
    }

    return true;
};
