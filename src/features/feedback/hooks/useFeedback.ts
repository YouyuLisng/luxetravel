'use client';

import { useQuery } from '@tanstack/react-query';
import { feedbackQuery } from '@/features/feedback/queries/feedbackQueries';

/** 取得單筆 Feedback */
export default function useFeedback(id: string, enabled = true) {
    const q = feedbackQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}
