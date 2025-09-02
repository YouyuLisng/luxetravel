'use client';

import { useQuery } from '@tanstack/react-query';
import { KEYS, fetchLexicons } from '../queries/lexiconQueries';

/** Hook: 取得 Lexicon 列表 */
export default function useLexicon(params?: Record<string, string>) {
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: KEYS.list(params),
        queryFn: () => fetchLexicons(params),
    });

    return {
        rows: data ?? [],
        isLoading,
        isError,
        error,
        refetch,
    };
}
