import React from 'react';
import { Badge } from '@/components/ui/badge';

interface FilesCounterBadgeProps {
    current: number;
    max: number;
    planName?: string;
}

export const FilesCounterBadge: React.FC<FilesCounterBadgeProps> = ({
    current,
    max,
    planName,
}) => {
    const isAtLimit = current >= max;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge
                variant={isAtLimit ? 'destructive' : 'outline'}
                className={isAtLimit ? 'animate-pulse' : ''}
            >
                {current} / {max}
            </Badge>
            {planName && (
                <Badge variant="secondary" className="text-xs">
                    {planName}
                </Badge>
            )}
        </div>
    );
};
