// components/ui/LoadingOverlay.tsx
'use client';

import { useLoadingStore } from '@/stores/useLoadingStore';

export default function LoadingOverlay() {
    const { loading } = useLoadingStore();

    if (!loading) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
        </div>
    );
}
