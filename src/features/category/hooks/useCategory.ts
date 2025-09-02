// features/region/hooks/useCategory.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    KEYS,
    categorysQuery,
    categoryQuery,
    createCategory,
    updateCategory,
    deleteCategory,
    type CategoryDTO,
} from '@/features/category/queries/categoryQueries';

/** 取得列表 */
export function useCategorysQuery() {
    return useQuery(categorysQuery());
}

/** 取得單筆 */
export function useCategoryQuery(id: string, enabled = true) {
    const q = categoryQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

/** 新增 */
export function useCreateCategoryMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CategoryDTO) => createCategory(payload),
        onSuccess: () => {
            // 新增成功 → 失效列表
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}

/** 更新 */
export function useUpdateCategoryMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: CategoryDTO }) =>
            updateCategory(id, payload),
        onSuccess: (_, { id }) => {
            // 更新成功 → 同步單筆與列表
            qc.invalidateQueries({ queryKey: KEYS.detail(id) });
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}

/** 刪除 */
export function useDeleteCategorynMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCategory(id),
        onSuccess: () => {
            // 刪除成功 → 失效列表
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}
