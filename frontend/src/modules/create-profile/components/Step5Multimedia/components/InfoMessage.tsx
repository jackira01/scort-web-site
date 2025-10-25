import React from 'react';

interface InfoMessageProps {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error';
}

const STYLES = {
    info: {
        container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
        icon: 'bg-blue-500',
        title: 'text-blue-800 dark:text-blue-200',
        message: 'text-blue-700 dark:text-blue-300',
        iconText: 'ℹ',
    },
    warning: {
        container: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        icon: 'bg-amber-500',
        title: 'text-amber-800 dark:text-amber-200',
        message: 'text-amber-700 dark:text-amber-300',
        iconText: '⚠',
    },
    error: {
        container: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
        icon: 'bg-red-500',
        title: 'text-red-800 dark:text-red-200',
        message: 'text-red-700 dark:text-red-300',
        iconText: '!',
    },
};

export const InfoMessage: React.FC<InfoMessageProps> = ({
    title,
    message,
    type = 'info',
}) => {
    const styles = STYLES[type];

    return (
        <div className={`${styles.container} border rounded-lg p-3`}>
            <div className="flex items-start space-x-2">
                <div className={`w-5 h-5 ${styles.icon} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className="text-white text-xs font-bold">{styles.iconText}</span>
                </div>
                <div className="flex-1">
                    <p className={`${styles.title} text-sm font-medium`}>
                        <strong>{title}</strong>
                    </p>
                    <p className={`${styles.message} text-sm mt-1`}>{message}</p>
                </div>
            </div>
        </div>
    );
};
