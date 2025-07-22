export interface VerificationImage {
    id: number;
    url: string;
    alt: string;
    verified?: boolean;
}

export interface ProfileVerificationCarouselProps {
    userId: string | undefined;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    profileName: string;
    images: VerificationImage[];
}