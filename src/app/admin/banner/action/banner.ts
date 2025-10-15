'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    BannerCreateSchema,
    BannerEditSchema,
    type BannerCreateValues,
    type BannerEditValues,
} from '@/schemas/banner';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

export async function createBanner(values: BannerCreateValues) {
    const parsed = BannerCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { imageUrl, title, subtitle, linkText, linkUrl, order } = parsed.data;

    const data = await db.banner.create({
        data: {
            imageUrl,
            title,
            subtitle: subtitle || null,
            linkText: linkText || null,
            linkUrl: linkUrl || null,
            order,
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 Banner（依 id，並刪除舊 blob 圖片） */
export async function editBanner(id: string, values: BannerEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = BannerEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.banner.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Banner' };

    const { imageUrl, title, subtitle, linkText, linkUrl, order } = parsed.data;

    if (imageUrl !== undefined && exists.imageUrl && exists.imageUrl !== imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    const data = await db.banner.update({
        where: { id },
        data: {
            imageUrl,
            title,
            subtitle: subtitle || null,
            linkText: linkText || null,
            linkUrl: linkUrl || null,
            order,
        },
    });

    return { success: '更新成功', data };
}

/** 刪除 Banner（依 id，並刪除 blob 圖片） */
export async function deleteBanner(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.banner.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 Banner' };

    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    const data = await db.banner.delete({ where: { id } });
    return { success: '刪除成功', data };
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */

const ReorderSchema = z.object({
    /** 拖曳後的完整 id 順序（上到下） */
    ids: z.array(z.string().min(1)).nonempty(),
    /** 起始排序值（預設 1） */
    startFrom: z.number().int().min(0).optional(),
});

/**
 * 依照傳入的 id 陣列重寫 `order` 欄位（連續整編）。
 * 兩段式交易避免與現有值衝突：先加大位移，再寫入最終順序。
 */
export async function reorderBanners(input: z.infer<typeof ReorderSchema>) {
    const parsed = ReorderSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { ids, startFrom = 1 } = parsed.data;

    // 檢查重複 id
    const set = new Set(ids);
    if (set.size !== ids.length) {
        return { error: 'ids 內含重複值' };
    }

    // 確認資料存在
    const existing = await db.banner.findMany({
        where: { id: { in: ids } },
        select: { id: true },
    });
    if (existing.length !== ids.length) {
        const existSet = new Set(existing.map((b) => b.id));
        const missing = ids.filter((id) => !existSet.has(id));
        return { error: `找不到 Banner：${missing.join(', ')}` };
    }

    try {
        await db.$transaction([
            // 暫存大位移
            ...ids.map((id, i) =>
                db.banner.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
            // 寫入最終連續順序
            ...ids.map((id, i) =>
                db.banner.update({
                    where: { id },
                    data: { order: startFrom + i },
                })
            ),
        ]);

        return { success: '排序已更新', count: ids.length };
    } catch (err) {
        console.error('reorderBanners error:', err);
        return { error: '更新排序失敗' };
    }
}

/** 便捷函式：直接丟 ids（可選 startFrom） */
export async function reorderBannersByIds(ids: string[], startFrom?: number) {
    if (!ids.length) return { error: 'ids 不可為空' };
    return reorderBanners({ ids: ids as [string, ...string[]], startFrom });
}
