// components/common/GlobalLoading.tsx
'use client';

import { useLoadingStore } from '@/stores/useLoadingStore';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GlobalLoading() {
    const { loading } = useLoadingStore();

    return (
        <div
            className={cn(
                'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 transition-opacity',
                loading
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
            )}
        >
            <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
    );
}
