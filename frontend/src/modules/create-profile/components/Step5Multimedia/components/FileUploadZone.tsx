import React from 'react';
import { Camera, Video, Mic } from 'lucide-react';

interface FileUploadZoneProps {
    type: 'photos' | 'videos' | 'audios';
    accept: string;
    onFileSelect: (files: FileList | null, event?: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    hasError?: boolean;
}

const ICONS = {
    photos: Camera,
    videos: Video,
    audios: Mic,
};

const LABELS = {
    photos: 'Añadir fotos',
    videos: 'Añadir videos',
    audios: 'Añadir audios',
};

const FORMATS = {
    photos: 'JPG, PNG, WEBP',
    videos: 'MP4, AVI, MOV hasta 10MB cada uno',
    audios: 'MP3, WAV, OGG hasta 10MB cada uno',
};

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
    type,
    accept,
    onFileSelect,
    disabled = false,
    hasError = false,
}) => {
    const Icon = ICONS[type];
    const inputId = `${type}-upload`;

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${disabled
                    ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 cursor-not-allowed opacity-60'
                    : 'hover:border-purple-500 cursor-pointer'
                } ${hasError ? 'border-red-500' : 'border-muted-foreground/30'}`}
        >
            <input
                type="file"
                accept={accept}
                multiple
                onChange={(e) => onFileSelect(e.target.files, e)}
                className="hidden"
                id={inputId}
                disabled={disabled}
            />
            <label
                htmlFor={inputId}
                className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                    {disabled ? 'Límite alcanzado' : LABELS[type]}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{FORMATS[type]}</p>
                {type === 'photos' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
                        📏 Recomendado: mínimo 500×600px para mejor calidad
                    </p>
                )}
            </label>
        </div>
    );
};
