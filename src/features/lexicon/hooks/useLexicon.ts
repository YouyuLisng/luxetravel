'use client';

import { useQuery } from '@tanstack/react-query';
import { lexiconQuery } from '@/features/lexicon/queries/lexiconQueries';

/** 取得單筆 Lexicon */
export default function useLexicon(id: string, enabled = true) {
    const q = lexiconQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}
