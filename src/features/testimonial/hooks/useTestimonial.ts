// src/features/testimonial/hooks/useTestimonial.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    testimonialsQuery,
    testimonialQuery,
    KEYS,
    type TestimonialDTO,
} from '../queries/testimonialQueries';

import {
    createTestimonial,
    editTestimonial,
    deleteTestimonial,
} from '@/app/admin/testimonial/action/testimonial';

/** 後端需要的嚴格型別 */
type ServerMode = 'REAL' | 'MARKETING';
type ServerPayload = {
    mode: ServerMode;
    content: string;
    order: number;
    nickname?: string | null;
    stars?: number | null; // 1~5
    linkUrl?: string | null;
};

/** 轉換前端 DTO -> 後端 payload（修正 mode / 預設 order / 正規化可選欄位） */
function toServerPayload(input: TestimonialDTO): ServerPayload {
    const modeUpper = String(input.mode ?? '').toUpperCase();
    const mode: ServerMode = modeUpper === 'MARKETING' ? 'MARKETING' : 'REAL';

    return {
        mode,
        content: input.content,
        order: typeof input.order === 'number' ? input.order : 0,
        nickname: input.nickname ?? null,
        stars:
            typeof input.stars === 'number'
                ? Math.min(5, Math.max(1, input.stars))
                : null,
        linkUrl: input.linkUrl ?? null,
    };
}

/* ============== Queries ============== */

/** 取得全部 */
export function useTestimonialsQuery() {
    return useQuery(testimonialsQuery());
}

/** 取得單筆 */
export function useTestimonialQuery(id: string) {
    return useQuery(testimonialQuery(id));
}

/* ============== Mutations ============== */

/** 新增 */
export function useCreateTestimonialMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: TestimonialDTO) => {
            const res = await createTestimonial(toServerPayload(payload));
            if (res?.error) throw new Error(res.error);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}

/** 編輯 */
export function useEditTestimonialMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: TestimonialDTO;
        }) => {
            const res = await editTestimonial(id, toServerPayload(data));
            if (res?.error) throw new Error(res.error);
            return res.data;
        },
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
            qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
        },
    });
}

/** 刪除 */
export function useDeleteTestimonialMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await deleteTestimonial(id);
            if (res?.error) throw new Error(res.error);
            return true;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}
