'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    CountryShowcaseCreateSchema,
    CountryShowcaseEditSchema,
    type CountryShowcaseCreateValues,
    type CountryShowcaseEditValues,
} from '@/schemas/countryShowcase';

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

/** 編輯 CountryShowcase（依 id） */
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

/** 刪除 CountryShowcase（依 id） */
export async function deleteCountryShowcase(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.countryShowcase.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 CountryShowcase' };

    const data = await db.countryShowcase.delete({ where: { id } });
    return { success: '刪除成功', data };
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */

/** 驗證輸入參數 */
const ReorderSchema = z.object({
    /** 拖曳後的完整 id 順序（上到下） */
    ids: z.array(z.string().min(1)).nonempty(),
    /** 起始排序值（預設 1），例如想從 0 開始就傳 0 */
    startFrom: z.number().int().min(0).optional(),
});

/**
 * 依照傳入的 id 陣列重寫 `order` 欄位（連續整編）。
 * 採兩段式交易避免 unique(order) 的暫時衝突：先大幅位移，再寫入最終值。
 */
export async function reorderCountryShowcases(
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
        // 兩段式更新，避免 unique(order) 臨時衝突
        await db.$transaction([
            // 暫存大位移（確保與現有數值不重疊）
            ...ids.map((id, i) =>
                db.countryShowcase.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
            // 寫入最終連續順序
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
    // 告知 TS 這裡已非空
    return reorderCountryShowcases({
        ids: ids as [string, ...string[]],
        startFrom,
    });
}
