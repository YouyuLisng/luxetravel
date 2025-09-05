'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import { TourMapSchema, type TourMapValues } from '@/schemas/tourmap';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 取代 TourMap (有就更新，沒有就新增) */
export async function replaceTourMap(values: TourMapValues) {
    const parsed = TourMapSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    try {
        const existing = await db.tourMap.findUnique({
            where: { productId: parsed.data.productId },
        });

        if (existing) {
            // 嘗試刪除舊圖片（如果需要）
            if (
                existing.imageUrl &&
                existing.imageUrl !== parsed.data.imageUrl
            ) {
                try {
                    await deleteFromVercelBlob(existing.imageUrl);
                } catch (err) {
                    console.warn('刪除舊圖片失敗:', existing.imageUrl, err);
                }
            }

            await db.tourMap.update({
                where: { productId: parsed.data.productId },
                data: {
                    imageUrl: parsed.data.imageUrl,
                    content: parsed.data.content ?? null,
                },
            });

            return { success: '地圖已更新成功' };
        } else {
            await db.tourMap.create({
                data: {
                    productId: parsed.data.productId,
                    imageUrl: parsed.data.imageUrl,
                    content: parsed.data.content ?? null,
                },
            });

            return { success: '地圖已建立成功' };
        }
    } catch (err) {
        console.error('replaceTourMap error:', err);
        return { error: '地圖更新失敗' };
    }
}
