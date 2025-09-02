// features/banner/hooks/useBanner.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    KEYS,
    bannersQuery,
    bannerQuery,
    createBanner,
    updateBanner,
    deleteBanner,
    type BannerDTO,
} from '@/features/banner/queries/bannerQueries';

/** 取得列表 */
export function useBannersQuery() {
    return useQuery(bannersQuery());
}

/** 取得單筆 */
export function useBannerQuery(id: string, enabled = true) {
    const q = bannerQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}

/** 新增 */
export function useCreateBannerMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: BannerDTO) => createBanner(payload),
        onSuccess: () => {
            // 新增成功 → 失效列表
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}

/** 更新 */
export function useUpdateBannerMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: BannerDTO }) =>
            updateBanner(id, payload),
        onSuccess: (_, { id }) => {
            // 更新成功 → 同步單筆與列表
            qc.invalidateQueries({ queryKey: KEYS.detail(id) });
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}

/** 刪除 */
export function useDeleteBannerMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteBanner(id),
        onSuccess: () => {
            // 刪除成功 → 失效列表
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}
