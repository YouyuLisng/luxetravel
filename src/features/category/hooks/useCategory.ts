'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryQuery } from '@/features/category/queries/categoryQueries';

/** 取得單筆 Category */
export default function useCategory(id: string, enabled = true) {
    const q = categoryQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}
