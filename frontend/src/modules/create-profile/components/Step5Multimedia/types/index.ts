export interface ContentLimits {
    maxPhotos: number;
    maxVideos: number;
    maxAudios: number;
}

export interface DefaultPlanConfig {
    enabled: boolean;
    planId: string | null;
    planCode: string | null;
}

export interface ImageToCrop {
    file: File;
    index: number;
    isFromUrl?: boolean; // ✅ Indica si la imagen original era una URL (no aplicar marca de agua)
}

export interface VideoCoverToCrop {
    file: File;
    videoIndex: number;
}

export type FileType = 'photos' | 'videos' | 'audios';

export interface FileValidationConfig {
    validTypes: string[];
    maxSize?: number;
}

export const FILE_VALIDATION_CONFIG: Record<FileType, FileValidationConfig> = {
    photos: {
        validTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },
    videos: {
        validTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    audios: {
        validTypes: [
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/ogg',
            'audio/m4a',
            'audio/x-m4a',
        ],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
};
