'use client';

import { useQuery } from '@tanstack/react-query';

interface User {
    id: string;
    name?: string;
    email: string;
    image?: string;
    role?: 'USER' | 'ADMIN';
}

export const useMe = () => {
    return useQuery<User | null>({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await fetch('/api/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            });

            if (res.status === 401) return null;
            if (!res.ok) throw new Error('無法取得使用者資訊');

            const data = await res.json();
            return data.user as User;
        },
        staleTime: 1000 * 60 * 5, // 5 分鐘內不重新抓
    });
};
