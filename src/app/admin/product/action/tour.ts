'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { TourSchema, type TourValues } from '@/schemas/tours';

/** 取代 Tours (先刪除，再新增) */
export async function replaceTours(productId: string, tours: TourValues[]) {
    const parsed = z.array(TourSchema).safeParse(tours);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    try {
        // 先刪除舊資料
        await db.tours.deleteMany({ where: { productId } });

        // 新增多筆資料
        if (parsed.data.length > 0) {
            await db.tours.createMany({
                data: parsed.data.map((t) => ({
                    productId,
                    code: t.code,
                    departDate: t.departDate,
                    returnDate: t.returnDate,
                    adult: t.prices.adult,
                    childWithBed: t.prices.childWithBed,
                    childNoBed: t.prices.childNoBed,
                    infant: t.prices.infant,
                    deposit: t.deposit ?? null,
                    status: t.status,
                    note: t.note ?? null,
                    arrangement: t.arrangement ?? null,
                })),
            });
        }

        return { success: '團體已更新成功' };
    } catch (err) {
        console.error('replaceTours error:', err);
        return { error: '團體更新失敗' };
    }
}
