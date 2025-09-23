'use server';

import { db } from '@/lib/db';
import {
    ItineraryCreateSchema,
    type ItineraryCreateValues,
} from '@/schemas/itinerary';

type ReplacePayload = { itineraries: ItineraryCreateValues[] };

/** 覆寫某產品的所有行程 */
export async function replaceItineraries(
    productId: string,
    payload: ReplacePayload
) {
    const parsed = ItineraryCreateSchema.safeParse(payload);
    if (!parsed.success) return { error: '欄位格式錯誤' };
    console.log('parsed:', parsed.data);

    try {
        // ⚡ Transaction 保證一致性，延長 timeout 到 60 秒
        await db.$transaction(
            async (tx) => {
                // 1. 先刪掉舊資料（連帶 routes/attractions）
                await tx.itinerary.deleteMany({ where: { productId } });

                // 2. 新建全部行程
                for (const it of parsed.data.itineraries) {
                    await tx.itinerary.create({
                        data: {
                            productId,
                            day: it.day,
                            title: it.title,
                            subtitle: it.subtitle,
                            content: it.content,
                            breakfast: it.breakfast,
                            lunch: it.lunch,
                            dinner: it.dinner,
                            hotel: it.hotel,
                            note: it.note,
                            featured: it.featured ?? false,
                            routes: {
                                create:
                                    it.routes?.map((r) => ({
                                        ...r,
                                    })) ?? [],
                            },
                            attractions: {
                                create:
                                    it.attractions?.map((a) => ({
                                        attractionId: a.attractionId,
                                        visitType: a.visitType,
                                    })) ?? [],
                            },
                        },
                    });
                }
            },
            { timeout: 60000 } // ⏱️ 60 秒
        );

        return { success: '每日行程更新成功' };
    } catch (e) {
        console.error(e);
        return { error: '每日行程更新失敗' };
    }
}
