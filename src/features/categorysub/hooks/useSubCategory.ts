'use client';

import { useQuery } from '@tanstack/react-query';
import { subCategoryQuery } from '@/features/categorysub/queries/subCategoryQueries';

/** 取得單筆 SubCategory */
export default function useSubCategory(id: string, enabled = true) {
    const q = subCategoryQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}
