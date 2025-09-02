'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    TravelConcernCreateSchema,
    TravelConcernEditSchema,
    type TravelConcernCreateValues,
    type TravelConcernEditValues,
} from '@/schemas/travelConcern';

/** 新增 TravelConcern */
export async function createTravelConcern(values: TravelConcernCreateValues) {
    const parsed = TravelConcernCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { moduleId, number, content, order } = parsed.data;

    // 可選：同 moduleId + number 不能重複
    const dup = await db.travelConcern.findFirst({
        where: { moduleId, number },
    });
    if (dup) return { error: '相同編號已存在於該模組' };

    const data = await db.travelConcern.create({
        data: { moduleId, number, content, order },
    });

    return { success: '新增成功', data };
}

/** 編輯 TravelConcern（依 id） */
export async function editTravelConcern(
    id: string,
    values: TravelConcernEditValues
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = TravelConcernEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.travelConcern.findUnique({ where: { id } });
    if (!exists) return { error: '找不到資料' };

    const { number, content, order } = parsed.data;

    const data = await db.travelConcern.update({
        where: { id },
        data: { number, content, order },
    });

    return { success: '更新成功', data };
}

/** 刪除 TravelConcern（依 id） */
export async function deleteTravelConcern(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.travelConcern.findUnique({ where: { id } });
    if (!exists) return { error: '找不到資料' };

    const data = await db.travelConcern.delete({ where: { id } });
    return { success: '刪除成功', data };
}

/* ------------------------- 拖曳排序 Server Actions ------------------------- */
/**
 * 建議：TravelConcern 屬於某一個 module（moduleId），通常排序應該「只在同一個 module 內」進行。
 * 這裡會檢查所有 ids 是否同屬同一個 moduleId，否則拒絕。
 */

const ReorderSchema = z.object({
    /** 拖曳後的完整 id 順序（上到下） */
    ids: z.array(z.string().min(1)).nonempty(),
    /** 起始排序值（預設 1），例如你希望從 0 開始可以傳 0 */
    startFrom: z.number().int().min(0).optional(),
});

export async function reorderTravelConcerns(
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

    // 取出所有項目，並確認是否同一個 moduleId
    const items = await db.travelConcern.findMany({
        where: { id: { in: ids } },
        select: { id: true, moduleId: true },
    });

    if (items.length !== ids.length) {
        const existSet = new Set(items.map((x) => x.id));
        const missing = ids.filter((id) => !existSet.has(id));
        return { error: `找不到資料：${missing.join(', ')}` };
    }

    const moduleSet = new Set(items.map((x) => x.moduleId));
    if (moduleSet.size !== 1) {
        return { error: '不同模組的資料不可同時排序' };
    }

    try {
        // 兩段式更新，避免 order 若有 unique 條件時的臨時衝突
        await db.$transaction([
            // 先大幅位移到安全區
            ...ids.map((id, i) =>
                db.travelConcern.update({
                    where: { id },
                    data: { order: startFrom + i + 1_000_000 },
                })
            ),
            // 再寫入最終順序（連續值）
            ...ids.map((id, i) =>
                db.travelConcern.update({
                    where: { id },
                    data: { order: startFrom + i },
                })
            ),
        ]);

        return { success: '排序已更新', count: ids.length };
    } catch (err) {
        console.error('reorderTravelConcerns error:', err);
        return { error: '更新排序失敗' };
    }
}

/** 便捷函式：直接丟 ids（可選 startFrom） */
export async function reorderTravelConcernsByIds(
    ids: string[],
    startFrom?: number
) {
    if (!ids?.length) return { error: 'ids 不可為空' };
    return reorderTravelConcerns({
        ids: ids as [string, ...string[]],
        startFrom,
    });
}
