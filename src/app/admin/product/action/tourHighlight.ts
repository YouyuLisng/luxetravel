'use server';

import { db } from '@/lib/db';
import {
    TourHighlightCreateSchema,
    TourHighlightEditSchema,
    type TourHighlightCreateValues,
    type TourHighlightEditValues,
} from '@/schemas/tourHighlight';

/** 建立 TourHighlight（單筆或多筆） */
export async function createTourHighlights(
    values: TourHighlightCreateValues | TourHighlightCreateValues[]
) {
    const items = Array.isArray(values) ? values : [values];

    // 驗證
    const parsedResults = items.map((item) =>
        TourHighlightCreateSchema.safeParse(item)
    );
    if (parsedResults.some((p) => !p.success)) {
        return { error: '欄位格式錯誤' };
    }
    const parsedItems = parsedResults.map(
        (p) => (p as any).data as TourHighlightCreateValues
    );

    // 檢查 product 是否存在
    for (const hl of parsedItems) {
        const productExists = await db.tourProduct.findUnique({
            where: { id: hl.productId },
        });
        if (!productExists)
            return { error: `找不到對應的產品 (${hl.productId})` };
    }

    try {
        if (parsedItems.length === 1) {
            const highlight = await db.tourHighlight.create({
                data: parsedItems[0],
            });
            return { success: '新增成功', data: highlight };
        } else {
            await db.tourHighlight.createMany({ data: parsedItems });
            return { success: `批次新增成功，共 ${parsedItems.length} 筆` };
        }
    } catch (err) {
        console.error('createTourHighlights error:', err);
        return { error: '新增失敗' };
    }
}

/** 編輯 TourHighlight（單筆或多筆） */
export async function editTourHighlights(
    idOrValues: string | { id: string; data: TourHighlightEditValues }[],
    values?: TourHighlightEditValues
) {
    try {
        if (typeof idOrValues === 'string') {
            const id = idOrValues;
            if (!id) return { error: '無效的 ID' };

            const parsed = TourHighlightEditSchema.safeParse(values);
            if (!parsed.success) return { error: '欄位格式錯誤' };

            const exists = await db.tourHighlight.findUnique({ where: { id } });
            if (!exists) return { error: '找不到行程亮點' };

            const highlight = await db.tourHighlight.update({
                where: { id },
                data: parsed.data,
            });
            return { success: '更新成功', data: highlight };
        } else {
            // 多筆編輯
            const items = idOrValues;
            for (const { id, data } of items) {
                const parsed = TourHighlightEditSchema.safeParse(data);
                if (!parsed.success) return { error: `ID ${id} 欄位格式錯誤` };

                const exists = await db.tourHighlight.findUnique({
                    where: { id },
                });
                if (!exists) return { error: `找不到行程亮點 (ID: ${id})` };

                await db.tourHighlight.update({
                    where: { id },
                    data: parsed.data,
                });
            }
            return { success: `批次更新成功，共 ${items.length} 筆` };
        }
    } catch (err) {
        console.error('editTourHighlights error:', err);
        return { error: '更新失敗' };
    }
}

/** 刪除 TourHighlight（單筆或多筆） */
export async function deleteTourHighlights(idOrIds: string | string[]) {
    try {
        if (typeof idOrIds === 'string') {
            const id = idOrIds;
            const exists = await db.tourHighlight.findUnique({ where: { id } });
            if (!exists) return { error: '找不到行程亮點' };

            await db.tourHighlight.delete({ where: { id } });
            return { success: '刪除成功', data: exists };
        } else {
            const ids = idOrIds;
            await db.tourHighlight.deleteMany({ where: { id: { in: ids } } });
            return { success: `批次刪除成功，共 ${ids.length} 筆` };
        }
    } catch (err) {
        console.error('deleteTourHighlights error:', err);
        return { error: '刪除失敗' };
    }
}
