'use client';

import { useQuery } from '@tanstack/react-query';
import {
    attractionsQuery,
    KEYS,
} from '@/features/attraction/queries/attractionQueries';

/** Hook: 取得 Attraction 列表 */
export default function useAttraction() {
    const { data, isLoading, isError, error, refetch } =
        useQuery(attractionsQuery());

    return {
        rows: data ?? [],
        isLoading,
        isError,
        error,
        refetch,
    };
}
