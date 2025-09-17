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

    const {
        imageUrl,
        imageUrl1,
        imageUrl2,
        title,
        subtitle,
        description,
        linkText,
        linkUrl,
        order,
    } = parsed.data;

    const data = await db.countryShowcase.create({
        data: {
            imageUrl,
            imageUrl1: imageUrl1 || null,
            imageUrl2: imageUrl2 || null,
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

    const {
        imageUrl,
        imageUrl1,
        imageUrl2,
        title,
        subtitle,
        description,
        linkText,
        linkUrl,
        order,
    } = parsed.data;

    // ⚡ 只檢查圖片欄位
    const imageFields = ['imageUrl', 'imageUrl1', 'imageUrl2'] as const;

    for (const field of imageFields) {
        const newValue = parsed.data[field];
        const oldValue = exists[field] as string | null;
        if (newValue !== undefined && oldValue && oldValue !== newValue) {
            try {
                await deleteFromVercelBlob(oldValue);
            } catch (err) {
                console.error(`刪除舊 Blob 圖片失敗 (${field}):`, err);
            }
        }
    }

    const data = await db.countryShowcase.update({
        where: { id },
        data: {
            imageUrl,
            imageUrl1: imageUrl1 || null,
            imageUrl2: imageUrl2 || null,
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
        select: { id: true, imageUrl: true, imageUrl1: true, imageUrl2: true },
    });
    if (!exists) return { error: '找不到 CountryShowcase' };

    // ⚡ 刪除舊圖片 (最多 3 張)
    for (const field of ['imageUrl', 'imageUrl1', 'imageUrl2'] as const) {
        if (exists[field]) {
            try {
                await deleteFromVercelBlob(exists[field]!);
            } catch (err) {
                console.error(`刪除 Blob 圖片失敗 (${field}):`, err);
            }
        }
    }

    const data = await db.countryShowcase.delete({ where: { id } });
    return { success: '刪除成功', data };
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */

const ReorderSchema = z.object({
    ids: z.array(z.string().min(1)).nonempty(),
    startFrom: z.number().int().min(0).optional(),
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
            ...ids.map((id, i) =>
                db.countryShowcase.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
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
