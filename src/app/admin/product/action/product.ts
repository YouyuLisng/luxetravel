'use server';

import { db } from '@/lib/db';
import {
    TourProductCreateSchema,
    TourProductEditSchema,
    type TourProductCreateValues,
    type TourProductEditValues,
} from '@/schemas/tourProduct';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 建立 TourProduct，並依據 days 自動建立 Itinerary */
export async function createTourProduct(values: TourProductCreateValues) {
    const parsed = TourProductCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const {
        code,
        namePrefix,
        name,
        mainImageUrl,
        summary,
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
                mainImageUrl,
                summary: summary || null,
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
                        title: '',
                    })),
                },
            },
            include: { itineraries: true },
        });

        return { success: '行程新增成功', data: product };
    } catch (err) {
        console.error('createTourProduct error:', err);
        return { error: '行程新增失敗' };
    }
}

/** 編輯 TourProduct（依 id） */
export async function editTourProduct(
    id: string,
    values: TourProductEditValues
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = TourProductEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.tourProduct.findUnique({ where: { id } });
    if (!exists) return { error: '找不到產品' };

    const {
        code,
        namePrefix,
        name,
        mainImageUrl,
        summary,
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
        if (
            mainImageUrl &&
            exists.mainImageUrl &&
            mainImageUrl !== exists.mainImageUrl
        ) {
            try {
                await deleteFromVercelBlob(exists.mainImageUrl);
            } catch (err) {
                console.warn('刪除舊圖片失敗:', exists.mainImageUrl, err);
            }
        }

        const product = await db.tourProduct.update({
            where: { id },
            data: {
                code,
                namePrefix: namePrefix || null,
                name,
                mainImageUrl,
                summary: summary || null,
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
            },
        });

        // 3️⃣ 同步 itinerary
        const existingItineraries = await db.itinerary.findMany({
            where: { productId: id },
            orderBy: { day: 'asc' },
        });

        if (days > existingItineraries.length) {
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
            await db.itinerary.deleteMany({
                where: {
                    productId: id,
                    day: { gt: days },
                },
            });
        }

        return { success: '行程更新成功', data: product };
    } catch (err) {
        console.error('editTourProduct error:', err);
        return { error: '行程更新失敗' };
    }
}

/** 刪除 TourProduct（依 id，同時刪關聯資料 & blob 圖片） */
export async function deleteTourProduct(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.tourProduct.findUnique({
        where: { id },
        include: {
            map: true, 
            highlights: true, 
        },
    });
    if (!exists) return { error: '找不到產品' };

    try {
        const imageUrls: string[] = [];
        if (exists.mainImageUrl) imageUrls.push(exists.mainImageUrl);

        if (exists.map?.imageUrl) {
            imageUrls.push(exists.map.imageUrl);
        }

        for (const h of exists.highlights) {
            if (h.imageUrls) {
                for (const url of h.imageUrls) {
                    if (url) imageUrls.push(url);
                }
            }
        }

        for (const url of imageUrls) {
            try {
                await deleteFromVercelBlob(url);
            } catch (err) {
                console.warn('刪除 blob 失敗:', url, err);
            }
        }

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
