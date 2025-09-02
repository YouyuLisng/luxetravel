// src/features/feedback/hooks/useFeedbackRow.ts
'use client';

import { useMemo } from 'react';
import { useFeedback } from './useFeedback';
import type { FeedbackEntity } from '@/features/feedback/queries/feedbackQueries';

export type FeedbackRow = FeedbackEntity & {
    countryNames: string[];
};

export function useFeedbackRows() {
    const query = useFeedback();

    const rows = useMemo<FeedbackRow[]>(() => {
        const list = query.data ?? [];
        return list.map((f) => {
            const names = (f.countries ?? [])
                .map((c) => c.nameZh || c.name || '')
                .filter(Boolean);
            return {
                ...f,
                countryNames: names,
            };
        });
    }, [query.data]);

    return {
        rows,
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
        data: query.data,
    };
}
