'use client';

import { useQuery } from '@tanstack/react-query';
import { bannersQuery } from '@/features/banner/queries/bannerQueries';

/** 取得 Banner 列表（分頁版） */
export default function useBannerRow(page: number, pageSize: number) {
    const { data, isLoading, isError, error, refetch } = useQuery(
        bannersQuery(page, pageSize)
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
