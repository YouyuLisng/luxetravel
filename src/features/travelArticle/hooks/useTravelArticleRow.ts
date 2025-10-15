'use client';

import { useQuery } from '@tanstack/react-query';
import { travelArticlesQuery } from '@/features/travelArticle/queries/travelArticleQueries';

/** 取得 TravelArticle 列表（分頁版） */
export default function useTravelArticleRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        travelArticlesQuery(page, pageSize)
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
