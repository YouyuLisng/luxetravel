'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    TestimonialCreateSchema,
    TestimonialEditSchema,
    type TestimonialCreateValues,
    type TestimonialEditValues,
} from '@/schemas/testimonial';
import { deleteFromVercelBlob } from '@/lib/vercel-blob'; // ⬅️ 加入

function normalize(v: TestimonialCreateValues | TestimonialEditValues) {
    return {
        ...v,
        nickname: v.nickname?.trim() || null,
        linkUrl: v.linkUrl?.trim() || null,
        stars: v.stars ?? null,
        order: typeof v.order === 'number' ? v.order : 0,
        imageUrl: v.imageUrl?.trim() || null,
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
        if (values.imageUrl && exists.imageUrl && values.imageUrl !== exists.imageUrl) {
            try {
                await deleteFromVercelBlob(exists.imageUrl);
            } catch (err) {
                console.warn('刪除舊圖片失敗:', exists.imageUrl, err);
            }
        }

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
        // 刪除 blob 圖片
        if (exists.imageUrl) {
            try {
                await deleteFromVercelBlob(exists.imageUrl);
            } catch (err) {
                console.warn('刪除圖片失敗:', exists.imageUrl, err);
            }
        }

        await db.testimonial.delete({ where: { id } });
        return { success: '刪除成功' };
    } catch (e) {
        console.error('deleteTestimonial error:', e);
        return { error: '刪除失敗' };
    }
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */
const ReorderSchema = z.object({
    ids: z.array(z.string().min(1)).nonempty(),
    startFrom: z.number().int().min(0).optional(),
});

export async function reorderTestimonials(
    input: z.infer<typeof ReorderSchema>
) {
    const parsed = ReorderSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { ids, startFrom = 1 } = parsed.data;

    const set = new Set(ids);
    if (set.size !== ids.length) {
        return { error: 'ids 內含重複值' };
    }

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
            ...ids.map((id, i) =>
                db.testimonial.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
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
