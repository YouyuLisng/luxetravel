// components/providers/RouteLoadingProvider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoadingStore } from '@/stores/useLoadingStore';

export default function RouteLoadingProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { show, hide } = useLoadingStore();

    useEffect(() => {
        show();
        const timeout = setTimeout(() => {
            hide();
        }, 300);

        return () => clearTimeout(timeout);
    }, [pathname, searchParams, show, hide]);

    return <>{children}</>;
}
