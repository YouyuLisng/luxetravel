// src/app/admin/testimonial/action/testimonial.ts
'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    TestimonialCreateSchema,
    TestimonialEditSchema,
    type TestimonialCreateValues,
    type TestimonialEditValues,
} from '@/schemas/testimonial';

// 只在檔案內使用，不 export（避免 use server 限制）
function normalize(v: TestimonialCreateValues | TestimonialEditValues) {
    return {
        ...v,
        nickname: v.nickname?.trim() || null,
        linkUrl: v.linkUrl?.trim() || null,
        stars: v.stars ?? null,
        order: typeof v.order === 'number' ? v.order : 0,
    };
}

export async function createTestimonial(values: TestimonialCreateValues) {
    const parsed = TestimonialCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    try {
        const data = normalize(parsed.data);
        const created = await db.testimonial.create({ data });
        return { success: '新增成功', data: created };
    } catch (e) {
        console.error('createTestimonial error:', e);
        return { error: '新增失敗' };
    }
}

export async function editTestimonial(
    id: string,
    values: TestimonialEditValues
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = TestimonialEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.testimonial.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Testimonial' };

    try {
        const data = normalize(parsed.data);
        const updated = await db.testimonial.update({ where: { id }, data });
        return { success: '更新成功', data: updated };
    } catch (e) {
        console.error('editTestimonial error:', e);
        return { error: '更新失敗' };
    }
}

export async function deleteTestimonial(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.testimonial.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Testimonial' };

    try {
        await db.testimonial.delete({ where: { id } });
        return { success: '刪除成功' };
    } catch (e) {
        console.error('deleteTestimonial error:', e);
        return { error: '刪除失敗' };
    }
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */
/**
 * 接收拖曳後的完整 id 陣列，依序重寫 order。
 * 兩段式更新：先把這批移到安全區（+1_000_000），再寫入最終連續值。
 */

const ReorderSchema = z.object({
    /** 拖曳後的完整 id 順序（上到下） */
    ids: z.array(z.string().min(1)).nonempty(),
    /** 起始排序值（預設 1；如需從 0 開始可傳 0） */
    startFrom: z.number().int().min(0).optional(),
});

export async function reorderTestimonials(
    input: z.infer<typeof ReorderSchema>
) {
    const parsed = ReorderSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { ids, startFrom = 1 } = parsed.data;

    // 檢查重複 id
    const set = new Set(ids);
    if (set.size !== ids.length) {
        return { error: 'ids 內含重複值' };
    }

    // 確認資料存在
    const existing = await db.testimonial.findMany({
        where: { id: { in: ids } },
        select: { id: true },
    });
    if (existing.length !== ids.length) {
        const existSet = new Set(existing.map((x) => x.id));
        const missing = ids.filter((id) => !existSet.has(id));
        return { error: `找不到資料：${missing.join(', ')}` };
    }

    try {
        await db.$transaction([
            // 暫存大位移（避免 order 若有 unique 條件時的臨時衝突）
            ...ids.map((id, i) =>
                db.testimonial.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
            // 寫入最終連續順序
            ...ids.map((id, i) =>
                db.testimonial.update({
                    where: { id },
                    data: { order: startFrom + i },
                })
            ),
        ]);

        return { success: '排序已更新', count: ids.length };
    } catch (e) {
        console.error('reorderTestimonials error:', e);
        return { error: '更新排序失敗' };
    }
}

/** 便捷函式：直接丟 ids（可選 startFrom） */
export async function reorderTestimonialsByIds(
    ids: string[],
    startFrom?: number
) {
    if (!ids?.length) return { error: 'ids 不可為空' };
    return reorderTestimonials({
        ids: ids as [string, ...string[]],
        startFrom,
    });
}
