// src/app/admin/product/action/flight.ts
'use server';

import { db } from '@/lib/db';
import {
    FlightCreateSchema,
    FlightEditSchema,
    type FlightCreateValues,
    type FlightEditValues,
} from '@/schemas/flight';

/** 建立 Flight（單筆或多筆） */
export async function createFlights(
    values: FlightCreateValues | FlightCreateValues[]
) {
    const items = Array.isArray(values) ? values : [values];

    // 驗證格式
    const parsedResults = items.map((item) =>
        FlightCreateSchema.safeParse(item)
    );
    if (parsedResults.some((p) => !p.success)) {
        return { error: '欄位格式錯誤' };
    }
    const parsedItems = parsedResults.map(
        (p) => (p as any).data as FlightCreateValues
    );

    // 檢查產品存在性
    for (const flight of parsedItems) {
        const productExists = await db.tourProduct.findUnique({
            where: { id: flight.productId },
        });
        if (!productExists)
            return { error: `找不到對應的產品 (${flight.productId})` };
    }

    try {
        if (parsedItems.length === 1) {
            const flight = await db.flight.create({
                data: parsedItems[0],
            });
            return { success: '新增成功', data: flight };
        } else {
            await db.flight.createMany({ data: parsedItems });
            return { success: `批次新增成功，共 ${parsedItems.length} 筆` };
        }
    } catch (err) {
        console.error('createFlights error:', err);
        return { error: '新增失敗' };
    }
}

/** 編輯 Flight（單筆或多筆） */
export async function editFlights(
    idOrValues: string | { id: string; data: FlightEditValues }[],
    values?: FlightEditValues
) {
    try {
        // 單筆編輯
        if (typeof idOrValues === 'string') {
            const id = idOrValues;
            if (!id) return { error: '無效的 ID' };

            const parsed = FlightEditSchema.safeParse(values);
            if (!parsed.success) return { error: '欄位格式錯誤' };

            const exists = await db.flight.findUnique({ where: { id } });
            if (!exists) return { error: '找不到航班資料' };

            const flight = await db.flight.update({
                where: { id },
                data: parsed.data,
            });
            return { success: '更新成功', data: flight };
        }

        // 多筆編輯
        const items = idOrValues;
        for (const { id, data } of items) {
            const parsed = FlightEditSchema.safeParse(data);
            if (!parsed.success) return { error: `ID ${id} 欄位格式錯誤` };

            const exists = await db.flight.findUnique({ where: { id } });
            if (!exists) return { error: `找不到航班資料 (ID: ${id})` };

            await db.flight.update({ where: { id }, data: parsed.data });
        }
        return { success: `批次更新成功，共 ${items.length} 筆` };
    } catch (err) {
        console.error('editFlights error:', err);
        return { error: '更新失敗' };
    }
}

/** 刪除 Flight（單筆或多筆） */
export async function deleteFlights(idOrIds: string | string[]) {
    try {
        if (typeof idOrIds === 'string') {
            const id = idOrIds;
            if (!id) return { error: '無效的 ID' };

            const exists = await db.flight.findUnique({ where: { id } });
            if (!exists) return { error: '找不到航班資料' };

            await db.flight.delete({ where: { id } });
            return { success: '刪除成功', data: exists };
        }

        const ids = idOrIds;
        if (!ids.length) return { error: '刪除清單為空' };

        const deleted = await db.flight.deleteMany({
            where: { id: { in: ids } },
        });
        return { success: `批次刪除成功，共 ${deleted.count} 筆` };
    } catch (err) {
        console.error('deleteFlights error:', err);
        return { error: '刪除失敗' };
    }
}

/** 查詢某產品下的 Flights */
export async function getFlightsByProductId(
    productId: string
): Promise<{ data: FlightCreateValues[] } | { error: string }> {
    if (!productId) return { error: '缺少 productId' };

    try {
        const flights = await db.flight.findMany({
            where: { productId },
            orderBy: { createdAt: 'asc' },
        });
        return { data: flights };
    } catch (err) {
        console.error('getFlightsByProductId error:', err);
        return { error: '查詢失敗' };
    }
}
