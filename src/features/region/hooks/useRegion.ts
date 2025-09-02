'use client';

import { useQuery } from '@tanstack/react-query';
import { regionsQuery } from '../queries/regionQueries';

/** Hook: 取得 Region 列表 */
export default function useRegion() {
    const { data, isLoading, isError, error, refetch } = useQuery(regionsQuery());

    return {
        rows: data ?? [],
        isLoading,
        isError,
        error,
        refetch,
    };
}
