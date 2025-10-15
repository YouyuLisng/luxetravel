'use server';

import { db } from '@/lib/db';
import {
    ItineraryCreateSchema,
    ItinerarySchema,
    type ItineraryCreateValues,
} from '@/schemas/itinerary';

type ReplacePayload = { itineraries: ItineraryCreateValues[] };

// ✅ 處理 hotel 欄位
function formatHotel(hotel?: string | null): string | null {
    if (hotel == null) return null;

    const parts = hotel.split(' 或 ');
    if (parts.length === 1) return hotel;

    return parts.slice(0, -1).join('<br/>') + ' 或 ' + parts[parts.length - 1];
}

/** ✅ 覆寫某產品的所有行程 */
export async function replaceItineraries(
    productId: string,
    payload: ReplacePayload
) {
    const parsed = ItineraryCreateSchema.safeParse(payload);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    try {
        await db.$transaction(
            async (tx) => {
                await tx.itinerary.deleteMany({ where: { productId } });

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
                            hotel: formatHotel(it.hotel),
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
            { timeout: 60000 }
        );

        return { success: '每日行程更新成功' };
    } catch (e) {
        console.error(e);
        return { error: '每日行程更新失敗' };
    }
}

/** ✅ 覆寫某產品的單一天行程（不影響其他天） */
export async function replaceItineraryByDay(
    productId: string,
    itinerary: ItineraryCreateValues
) {
    // 驗證單筆行程格式
    const parsed = ItinerarySchema.safeParse(itinerary);
    if (!parsed.success) {
        console.error(parsed.error.format());
        return { error: '欄位格式錯誤' };
    }

    try {
        await db.$transaction(async (tx) => {
            // 先刪除該天舊資料
            await tx.itinerary.deleteMany({
                where: { productId, day: itinerary.day },
            });

            // 建立新資料
            await tx.itinerary.create({
                data: {
                    productId,
                    day: itinerary.day,
                    title: itinerary.title,
                    subtitle: itinerary.subtitle,
                    content: itinerary.content,
                    breakfast: itinerary.breakfast,
                    lunch: itinerary.lunch,
                    dinner: itinerary.dinner,
                    hotel: formatHotel(itinerary.hotel),
                    note: itinerary.note,
                    featured: itinerary.featured ?? false,
                    routes: {
                        create:
                            itinerary.routes?.map((r) => ({
                                ...r,
                            })) ?? [],
                    },
                    attractions: {
                        create:
                            itinerary.attractions?.map((a) => ({
                                attractionId: a.attractionId,
                                visitType: a.visitType,
                            })) ?? [],
                    },
                },
            });
        });

        return { success: `第 ${itinerary.day} 天行程更新成功` };
    } catch (e) {
        console.error(e);
        return { error: `第 ${itinerary.day} 天行程更新失敗` };
    }
}
