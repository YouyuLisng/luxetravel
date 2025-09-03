'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    CountryShowcaseCreateSchema,
    CountryShowcaseEditSchema,
    type CountryShowcaseCreateValues,
    type CountryShowcaseEditValues,
} from '@/schemas/countryShowcase';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 CountryShowcase */
export async function createCountryShowcase(
    values: CountryShowcaseCreateValues
) {
    const parsed = CountryShowcaseCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { imageUrl, title, subtitle, description, linkText, linkUrl, order } =
        parsed.data;

    const data = await db.countryShowcase.create({
        data: {
            imageUrl,
            title,
            subtitle: subtitle || null,
            description: description || null,
            linkText: linkText || null,
            linkUrl: linkUrl || null,
            order,
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 CountryShowcase（依 id，並刪除舊 blob 圖片） */
export async function editCountryShowcase(
    id: string,
    values: CountryShowcaseEditValues
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = CountryShowcaseEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.countryShowcase.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 CountryShowcase' };

    const { imageUrl, title, subtitle, description, linkText, linkUrl, order } =
        parsed.data;

    // ⚡ 如果換圖，刪掉舊 blob
    if (
        imageUrl !== undefined &&
        exists.imageUrl &&
        exists.imageUrl !== imageUrl
    ) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    const data = await db.countryShowcase.update({
        where: { id },
        data: {
            imageUrl,
            title,
            subtitle: subtitle || null,
            description: description || null,
            linkText: linkText || null,
            linkUrl: linkUrl || null,
            order,
        },
    });

    return { success: '更新成功', data };
}

/** 刪除 CountryShowcase（依 id，並刪除 blob 圖片） */
export async function deleteCountryShowcase(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.countryShowcase.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 CountryShowcase' };

    // ⚡ 刪除舊圖片
    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    const data = await db.countryShowcase.delete({ where: { id } });
    return { success: '刪除成功', data };
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */

const ReorderSchema = z.object({
    ids: z.array(z.string().min(1)).nonempty(), /// 拖曳後完整順序
    startFrom: z.number().int().min(0).optional(), /// 起始排序值（預設 1）
});

/** 重排 CountryShowcase */
export async function reorderCountryShowcases(
    input: z.infer<typeof ReorderSchema>
) {
    const parsed = ReorderSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { ids, startFrom = 1 } = parsed.data;

    // 檢查重複
    const set = new Set(ids);
    if (set.size !== ids.length) {
        return { error: 'ids 內含重複值' };
    }

    // 確認存在
    const existing = await db.countryShowcase.findMany({
        where: { id: { in: ids } },
        select: { id: true },
    });
    if (existing.length !== ids.length) {
        const existSet = new Set(existing.map((x) => x.id));
        const missing = ids.filter((id) => !existSet.has(id));
        return { error: `找不到 CountryShowcase：${missing.join(', ')}` };
    }

    try {
        await db.$transaction([
            // 暫存位移避免 unique(order) 衝突
            ...ids.map((id, i) =>
                db.countryShowcase.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
            // 最終順序
            ...ids.map((id, i) =>
                db.countryShowcase.update({
                    where: { id },
                    data: { order: startFrom + i },
                })
            ),
        ]);

        return { success: '排序已更新', count: ids.length };
    } catch (err) {
        console.error('reorderCountryShowcases error:', err);
        return { error: '更新排序失敗' };
    }
}

/** 便捷函式：直接丟 ids（可選 startFrom） */
export async function reorderCountryShowcasesByIds(
    ids: string[],
    startFrom?: number
) {
    if (!ids?.length) return { error: 'ids 不可為空' };
    return reorderCountryShowcases({
        ids: ids as [string, ...string[]],
        startFrom,
    });
}
