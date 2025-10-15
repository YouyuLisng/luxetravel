import { queryOptions } from '@tanstack/react-query';

interface User {
    id: string;
    name?: string;
    email: string;
    image?: string;
    role?: string;
}

export const meQuery = () =>
    queryOptions({
        queryKey: ['me'],
        queryFn: async (): Promise<User | null> => {
            const res = await fetch('/api/me', {
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            });

            if (res.status === 401) return null;
            if (!res.ok) throw new Error('使用者資料獲取失敗');

            const data = await res.json();
            return data.user;
        },
    });
