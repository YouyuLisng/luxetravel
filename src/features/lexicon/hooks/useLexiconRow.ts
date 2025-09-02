'use client';

import { useMemo } from 'react';
import { useLexicons } from '../queries/lexiconQueries';

/** Hook: 將 Lexicon 列表整理成 table row */
export default function useLexiconRow() {
    const { data, isLoading, isError, refetch } = useLexicons();

    const rows = useMemo(() => {
        if (!data) return [];
        return data.map((lex: any) => ({
            id: lex.id,
            title: lex.title,
            type: lex.type,
            context: lex.context,
            createdAt: lex.createdAt,
            updatedAt: lex.updatedAt,
        }));
    }, [data]);

    return {
        rows,
        isLoading,
        isError,
        refetch,
    };
}
