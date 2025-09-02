'use server';

import { db } from '@/lib/db';
import {
    TourMapCreateSchema,
    TourMapEditSchema,
    type TourMapCreateValues,
    type TourMapEditValues,
} from '@/schemas/tourmap';

/** 建立 TourMap（單筆或多筆） */
export async function createTourMaps(
    values: TourMapCreateValues | TourMapCreateValues[]
) {
    const items = Array.isArray(values) ? values : [values];

    // 驗證
    const parsedResults = items.map((item) =>
        TourMapCreateSchema.safeParse(item)
    );
    if (parsedResults.some((p) => !p.success)) {
        return { error: '欄位格式錯誤' };
    }
    const parsedItems = parsedResults.map(
        (p) => (p as any).data as TourMapCreateValues
    );

    // 檢查 product 是否存在
    for (const map of parsedItems) {
        const productExists = await db.tourProduct.findUnique({
            where: { id: map.productId },
        });
        if (!productExists)
            return { error: `找不到對應的產品 (${map.productId})` };
    }

    try {
        if (parsedItems.length === 1) {
            const map = await db.tourMap.create({ data: parsedItems[0] });
            return { success: '新增成功', data: map };
        } else {
            await db.tourMap.createMany({ data: parsedItems });
            return { success: `批次新增成功，共 ${parsedItems.length} 筆` };
        }
    } catch (err) {
        console.error('createTourMaps error:', err);
        return { error: '新增失敗' };
    }
}

/** 編輯 TourMap（單筆或多筆） */
export async function editTourMaps(
    idOrValues: string | { id: string; data: TourMapEditValues }[],
    values?: TourMapEditValues
) {
    try {
        if (typeof idOrValues === 'string') {
            const id = idOrValues;
            if (!id) return { error: '無效的 ID' };

            const parsed = TourMapEditSchema.safeParse(values);
            if (!parsed.success) return { error: '欄位格式錯誤' };

            const exists = await db.tourMap.findUnique({ where: { id } });
            if (!exists) return { error: '找不到地圖資料' };

            const map = await db.tourMap.update({
                where: { id },
                data: parsed.data,
            });
            return { success: '更新成功', data: map };
        } else {
            // 多筆編輯
            const items = idOrValues;
            for (const { id, data } of items) {
                const parsed = TourMapEditSchema.safeParse(data);
                if (!parsed.success) return { error: `ID ${id} 欄位格式錯誤` };

                const exists = await db.tourMap.findUnique({ where: { id } });
                if (!exists) return { error: `找不到地圖資料 (ID: ${id})` };

                await db.tourMap.update({ where: { id }, data: parsed.data });
            }
            return { success: `批次更新成功，共 ${items.length} 筆` };
        }
    } catch (err) {
        console.error('editTourMaps error:', err);
        return { error: '更新失敗' };
    }
}

/** 刪除 TourMap（單筆或多筆） */
export async function deleteTourMaps(idOrIds: string | string[]) {
    try {
        if (typeof idOrIds === 'string') {
            const id = idOrIds;
            const exists = await db.tourMap.findUnique({ where: { id } });
            if (!exists) return { error: '找不到地圖資料' };

            await db.tourMap.delete({ where: { id } });
            return { success: '刪除成功', data: exists };
        } else {
            const ids = idOrIds;
            await db.tourMap.deleteMany({ where: { id: { in: ids } } });
            return { success: `批次刪除成功，共 ${ids.length} 筆` };
        }
    } catch (err) {
        console.error('deleteTourMaps error:', err);
        return { error: '刪除失敗' };
    }
}
