'use server';

import { db } from '@/lib/db';
import {
    ItineraryCreateSchema,
    ItineraryEditSchema,
    type ItineraryCreateValues,
    type ItineraryEditValues,
} from '@/schemas/itinerary';

/** 建立 Itinerary（單筆或多筆） */
export async function createItineraries(
    values: ItineraryCreateValues | ItineraryCreateValues[]
) {
    const items = Array.isArray(values) ? values : [values];

    // 驗證
    const parsedResults = items.map((item) =>
        ItineraryCreateSchema.safeParse(item)
    );
    if (parsedResults.some((p) => !p.success)) {
        return { error: '欄位格式錯誤' };
    }
    const parsedItems = parsedResults.map(
        (p) => (p as any).data as ItineraryCreateValues
    );

    // 檢查 product 是否存在
    for (const it of parsedItems) {
        const productExists = await db.tourProduct.findUnique({
            where: { id: it.productId },
        });
        if (!productExists)
            return { error: `找不到對應的產品 (${it.productId})` };
    }

    try {
        if (parsedItems.length === 1) {
            const itinerary = await db.itinerary.create({
                data: parsedItems[0],
            });
            return { success: '新增成功', data: itinerary };
        } else {
            await db.itinerary.createMany({ data: parsedItems });
            return { success: `批次新增成功，共 ${parsedItems.length} 筆` };
        }
    } catch (err) {
        console.error('createItineraries error:', err);
        return { error: '新增失敗' };
    }
}

/** 編輯 Itinerary（單筆或多筆） */
export async function editItineraries(
    idOrValues: string | { id: string; data: ItineraryEditValues }[],
    values?: ItineraryEditValues
) {
    try {
        if (typeof idOrValues === 'string') {
            const id = idOrValues;
            if (!id) return { error: '無效的 ID' };

            const parsed = ItineraryEditSchema.safeParse(values);
            if (!parsed.success) return { error: '欄位格式錯誤' };

            const exists = await db.itinerary.findUnique({ where: { id } });
            if (!exists) return { error: '找不到行程資料' };

            const itinerary = await db.itinerary.update({
                where: { id },
                data: parsed.data,
            });
            return { success: '更新成功', data: itinerary };
        } else {
            // 多筆編輯
            const items = idOrValues;
            for (const { id, data } of items) {
                const parsed = ItineraryEditSchema.safeParse(data);
                if (!parsed.success) return { error: `ID ${id} 欄位格式錯誤` };

                const exists = await db.itinerary.findUnique({ where: { id } });
                if (!exists) return { error: `找不到行程資料 (ID: ${id})` };

                await db.itinerary.update({ where: { id }, data: parsed.data });
            }
            return { success: `批次更新成功，共 ${items.length} 筆` };
        }
    } catch (err) {
        console.error('editItineraries error:', err);
        return { error: '更新失敗' };
    }
}

/** 刪除 Itinerary（單筆或多筆） */
export async function deleteItineraries(idOrIds: string | string[]) {
    try {
        if (typeof idOrIds === 'string') {
            const id = idOrIds;
            const exists = await db.itinerary.findUnique({ where: { id } });
            if (!exists) return { error: '找不到行程資料' };

            await db.itinerary.delete({ where: { id } });
            return { success: '刪除成功', data: exists };
        } else {
            const ids = idOrIds;
            await db.itinerary.deleteMany({ where: { id: { in: ids } } });
            return { success: `批次刪除成功，共 ${ids.length} 筆` };
        }
    } catch (err) {
        console.error('deleteItineraries error:', err);
        return { error: '刪除失敗' };
    }
}
