// src/features/feedback/hooks/useFeedback.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { feedbackListQuery } from '@/features/feedback/queries/feedbackQueries';

export function useFeedback() {
    const query = useQuery(feedbackListQuery());

    return {
        ...query,
        data: query.data ?? [],
    };
}
