'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    TravelAdvantageCreateSchema,
    TravelAdvantageEditSchema,
    type TravelAdvantageCreateValues,
    type TravelAdvantageEditValues,
} from '@/schemas/travelAdvantage';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';
/** 新增 TravelAdvantage */
export async function createTravelAdvantage(
    values: TravelAdvantageCreateValues
) {
    const parsed = TravelAdvantageCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { moduleId, imageUrl, title, content, order } = parsed.data;

    // 檢查 module 是否存在（可選）
    const mod = await db.module.findUnique({ where: { id: moduleId } });
    if (!mod) return { error: '找不到對應的 Module' };

    const data = await db.travelAdvantage.create({
        data: { moduleId, imageUrl, title, content, order },
    });

    return { success: '新增成功', data };
}

/** 編輯 TravelAdvantage（依 id） */
export async function editTravelAdvantage(
    id: string,
    values: TravelAdvantageEditValues
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = TravelAdvantageEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.travelAdvantage.findUnique({ where: { id } });
    if (!exists) return { error: '找不到資料' };

    const { imageUrl, title, content, order } = parsed.data;

    // 如果有傳新圖，且和舊的不一樣，就刪掉舊的 blob
    if (imageUrl && exists.imageUrl && exists.imageUrl !== imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    const data = await db.travelAdvantage.update({
        where: { id },
        data: { imageUrl, title, content, order },
    });

    return { success: '更新成功', data };
}

/** 刪除 TravelAdvantage（依 id） */
export async function deleteTravelAdvantage(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.travelAdvantage.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到資料' };

    // 先刪除 Vercel Blob 圖片
    if (exists.imageUrl) {
        await deleteFromVercelBlob(exists.imageUrl);
    }

    // 再刪除 DB 資料
    const data = await db.travelAdvantage.delete({ where: { id } });
    return { success: '刪除成功', data };
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */
/**
 * 建議：TravelAdvantage 隸屬於某個 module（moduleId），排序應只在**同一個 module**內進行。
 * 這裡會檢查所有 ids 是否同屬同一個 moduleId，否則拒絕。
 */

const ReorderSchema = z.object({
    /** 拖曳後的完整 id 順序（上到下） */
    ids: z.array(z.string().min(1)).nonempty(),
    /** 起始排序值（預設 1），若希望從 0 開始可傳 0 */
    startFrom: z.number().int().min(0).optional(),
});

export async function reorderTravelAdvantages(
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

    // 取得項目並確認存在
    const items = await db.travelAdvantage.findMany({
        where: { id: { in: ids } },
        select: { id: true, moduleId: true },
    });

    if (items.length !== ids.length) {
        const existSet = new Set(items.map((x: { id: any }) => x.id));
        const missing = ids.filter((id) => !existSet.has(id));
        return { error: `找不到資料：${missing.join(', ')}` };
    }

    // 確認同一個 moduleId
    const moduleSet = new Set(items.map((x: { moduleId: any }) => x.moduleId));
    if (moduleSet.size !== 1) {
        return { error: '不同模組的資料不可同時排序' };
    }

    try {
        // 兩段式更新，避免 order 暫時衝突（若有 unique 條件時）
        await db.$transaction([
            // 先全部位移到安全區
            ...ids.map((id, i) =>
                db.travelAdvantage.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
            // 寫入最終連續順序
            ...ids.map((id, i) =>
                db.travelAdvantage.update({
                    where: { id },
                    data: { order: startFrom + i },
                })
            ),
        ]);

        return { success: '排序已更新', count: ids.length };
    } catch (err) {
        console.error('reorderTravelAdvantages error:', err);
        return { error: '更新排序失敗' };
    }
}

/** 便捷函式：直接丟 ids（可選 startFrom） */
export async function reorderTravelAdvantagesByIds(
    ids: string[],
    startFrom?: number
) {
    if (!ids?.length) return { error: 'ids 不可為空' };
    return reorderTravelAdvantages({
        ids: ids as [string, ...string[]],
        startFrom,
    });
}
