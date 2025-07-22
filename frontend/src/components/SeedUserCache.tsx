'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function SeedUserCache() {
    const { data: session, status } = useSession();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (status === 'authenticated' && session.user) {
            queryClient.setQueryData(['user', session.user._id], session.user);
        }
    }, [status, session, queryClient]);

    return null;
}
