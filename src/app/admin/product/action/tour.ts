'use server';

import { db } from '@/lib/db';
import {
    ToursCreateSchema,
    ToursEditSchema,
    type ToursCreateValues,
    type ToursEditValues,
} from '@/schemas/tours';

/** 建立 Tours */
export async function createTours(values: ToursCreateValues) {
    const parsed = ToursCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const {
        productId,
        code,
        departDate,
        returnDate,
        adult,
        childWithBed,
        childNoBed,
        infant,
        deposit,
        status,
        note,
        arrange,
    } = parsed.data;

    // 檢查產品是否存在
    const productExists = await db.tourProduct.findUnique({
        where: { id: productId },
    });
    if (!productExists) return { error: '找不到對應的產品' };

    try {
        const tours = await db.tours.create({
            data: {
                productId,
                code,
                departDate,
                returnDate,
                adult,
                childWithBed,
                childNoBed,
                infant,
                deposit: deposit ?? null,
                status,
                note: note ?? null,
                arrange: arrange ?? null,
            },
        });

        return { success: '新增成功', data: tours };
    } catch (err) {
        console.error('createTours error:', err);
        return { error: '新增失敗' };
    }
}

/** 編輯 Tours（依 id） */
export async function editTours(id: string, values: ToursEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = ToursEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.tours.findUnique({ where: { id } });
    if (!exists) return { error: '找不到梯次資料' };

    const {
        productId,
        code,
        departDate,
        returnDate,
        adult,
        childWithBed,
        childNoBed,
        infant,
        deposit,
        status,
        note,
        arrange,
    } = parsed.data;

    // 如果更新了 productId，要檢查是否存在
    if (productId) {
        const productExists = await db.tourProduct.findUnique({
            where: { id: productId },
        });
        if (!productExists) return { error: '找不到對應的產品' };
    }

    try {
        const tours = await db.tours.update({
            where: { id },
            data: {
                productId: productId ?? exists.productId,
                code: code ?? exists.code,
                departDate: departDate ?? exists.departDate,
                returnDate: returnDate ?? exists.returnDate,
                adult: adult ?? exists.adult,
                childWithBed: childWithBed ?? exists.childWithBed,
                childNoBed: childNoBed ?? exists.childNoBed,
                infant: infant ?? exists.infant,
                deposit: deposit ?? exists.deposit,
                status: status ?? exists.status,
                note: note ?? exists.note,
                arrange: arrange ?? exists.arrange,
            },
        });

        return { success: '更新成功', data: tours };
    } catch (err) {
        console.error('editTours error:', err);
        return { error: '更新失敗' };
    }
}

/** 刪除 Tours（依 id） */
export async function deleteTours(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.tours.findUnique({ where: { id } });
    if (!exists) return { error: '找不到梯次資料' };

    try {
        await db.tours.delete({ where: { id } });
        return { success: '刪除成功', data: exists };
    } catch (err) {
        console.error('deleteTours error:', err);
        return { error: '刪除失敗' };
    }
}
