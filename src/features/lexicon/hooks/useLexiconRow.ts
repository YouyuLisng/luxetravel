'use client';

import { useQuery } from '@tanstack/react-query';
import { lexiconsQuery } from '@/features/lexicon/queries/lexiconQueries';

/** 取得 Lexicon 列表（分頁版，可選 type 篩選） */
export default function useLexiconRow(
    page: number,
    pageSize: number,
    type?: string
) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        lexiconsQuery(page, pageSize, type)
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
