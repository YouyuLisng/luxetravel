'use client';

import { useQuery } from '@tanstack/react-query';
import { feedbacksQuery } from '@/features/feedback/queries/feedbackQueries';

/** 取得 Feedback 列表（分頁版） */
export default function useFeedbackRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        feedbacksQuery(page, pageSize)
    );

    return {
        rows: data?.rows ?? [],
        pagination: data?.pagination,
        isLoading,
        isError,
        error,
        refetch,
    };
}
