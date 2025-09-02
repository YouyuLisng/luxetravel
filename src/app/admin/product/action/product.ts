'use server';

import { db } from '@/lib/db';
import {
    TourProductCreateSchema,
    TourProductEditSchema,
    type TourProductCreateValues,
    type TourProductEditValues,
} from '@/schemas/tourProduct';

/** 建立 TourProduct，並依據 days 自動建立 Itinerary + Flight */
export async function createTourProduct(values: TourProductCreateValues) {
    const parsed = TourProductCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const {
        code,
        namePrefix,
        name,
        description,
        days,
        nights,
        departAirport,
        arriveCountry,
        arriveCity,
        arriveAirport,
        category,
        priceMin,
        priceMax,
        tags,
        note,
        status,
        staff,
        reminder,
        policy,
        categoryId,
        subCategoryId,
    } = parsed.data;

    try {
        const product = await db.tourProduct.create({
            data: {
                code,
                namePrefix: namePrefix || null,
                name,
                description: description || null,
                days,
                nights,
                departAirport,
                arriveCountry,
                arriveCity,
                arriveAirport,
                category,
                priceMin,
                priceMax: priceMax ?? null,
                tags: tags ?? [],
                note: note || null,
                status,
                staff: staff || null,
                reminder: reminder || null,
                policy: policy || null,
                categoryId,
                subCategoryId: subCategoryId || null,
                itineraries: {
                    create: Array.from({ length: days }).map((_, i) => ({
                        day: i + 1,
                        title: `Day ${i + 1}`,
                    })),
                },
            },
            include: { itineraries: true },
        });

        // ⚡ 如果有填寫機場，建立 Flight 資料
        if (departAirport && arriveAirport) {
            // 查詢 Airport 資料表
            const dep = await db.airport.findUnique({
                where: { code: departAirport },
            });
            const arr = await db.airport.findUnique({
                where: { code: arriveAirport },
            });

            if (dep && arr) {
                await db.flight.createMany({
                    data: [
                        {
                            productId: product.id,
                            departAirport: dep.code,
                            departName: dep.nameZh,
                            arriveAirport: arr.code,
                            arriveName: arr.nameZh,
                            departTime: '', // 先留空，之後可編輯
                            arriveTime: '',
                            duration: '',
                            airlineCode: '',
                            airlineName: '',
                            flightNo: '',
                        },
                        {
                            productId: product.id,
                            departAirport: arr.code,
                            departName: arr.nameZh,
                            arriveAirport: dep.code,
                            arriveName: dep.nameZh,
                            departTime: '',
                            arriveTime: '',
                            duration: '',
                            airlineCode: '',
                            airlineName: '',
                            flightNo: '',
                        },
                    ],
                });
            }
        }

        return { success: '新增成功', data: product };
    } catch (err) {
        console.error('createTourProduct error:', err);
        return { error: '新增失敗' };
    }
}

/** 編輯 TourProduct（依 id） */
export async function editTourProduct(
    id: string,
    values: TourProductEditValues
) {
    console.log(values);
    if (!id) return { error: '無效的 ID' };

    const parsed = TourProductEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.tourProduct.findUnique({ where: { id } });
    if (!exists) return { error: '找不到產品' };
    const {
        code,
        namePrefix,
        name,
        description,
        days,
        nights,
        departAirport,
        arriveCountry,
        arriveCity,
        arriveAirport,
        category,
        priceMin,
        priceMax,
        tags,
        note,
        status,
        staff,
        reminder,
        policy,
    } = parsed.data;

    try {
        const product = await db.tourProduct.update({
            where: { id },
            data: {
                code,
                namePrefix: namePrefix || null,
                name,
                description: description || null,
                days,
                nights,
                departAirport,
                arriveCountry,
                arriveCity,
                arriveAirport,
                category,
                priceMin,
                priceMax: priceMax ?? null,
                tags: tags ?? [],
                note: note || null,
                status,
                staff: staff || null,
                reminder: reminder || null,
                policy: policy || null,
            },
        });

        // 如果 days 改變，補足或刪減 Itinerary
        const existingItineraries = await db.itinerary.findMany({
            where: { productId: id },
            orderBy: { day: 'asc' },
        });

        if (days > existingItineraries.length) {
            // 多出來的天數要新增
            const toCreate = Array.from(
                { length: days - existingItineraries.length },
                (_, i) => ({
                    productId: id,
                    day: existingItineraries.length + i + 1,
                    title: `Day ${existingItineraries.length + i + 1}`,
                })
            );
            await db.itinerary.createMany({ data: toCreate });
        } else if (days < existingItineraries.length) {
            // 減少天數要刪掉多餘的
            await db.itinerary.deleteMany({
                where: {
                    productId: id,
                    day: { gt: days },
                },
            });
        }

        return { success: '更新成功', data: product };
    } catch (err) {
        console.error('editTourProduct error:', err);
        return { error: '更新失敗' };
    }
}

/** 刪除 TourProduct（依 id，同時刪關聯資料） */
export async function deleteTourProduct(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.tourProduct.findUnique({ where: { id } });
    if (!exists) return { error: '找不到產品' };

    try {
        await db.$transaction([
            db.itinerary.deleteMany({ where: { productId: id } }),
            db.tours.deleteMany({ where: { productId: id } }),
            db.flight.deleteMany({ where: { productId: id } }),
            db.tourMap.deleteMany({ where: { productId: id } }),
            db.tourHighlight.deleteMany({ where: { productId: id } }),
            db.tourProduct.delete({ where: { id } }),
        ]);

        return { success: '刪除成功' };
    } catch (err) {
        console.error('deleteTourProduct error:', err);
        return { error: '刪除失敗' };
    }
}
