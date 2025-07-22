import type { User } from '@/types/user.types';

export const transformedImages = (verificationDocument: string[]) => {
    return verificationDocument.map((url, index) => ({
        id: index,
        url,
        alt: `Imagen ${index + 1}`,
    }));
};
