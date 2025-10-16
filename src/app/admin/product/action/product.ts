'use server';

import { db } from '@/lib/db';
import {
    TourProductCreateSchema,
    TourProductEditSchema,
    type TourProductCreateValues,
    type TourProductEditValues,
} from '@/schemas/tourProduct';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';
import { ProductType } from '@prisma/client';

/** 🔧 工具：確保 Prisma 欄位一定是 number（未填時改為 0） */
function toSafeNumber(value: number | null | undefined): number {
    return typeof value === 'number' && !isNaN(value) ? value : 0;
}

/** ✅ 建立 TourProduct */
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
        countries,
        note,
        memo,       // ✅ 新增
        deposit,    // ✅ 新增
        status,
        staff,
        reminder,
        policy,
        categoryId,
        subCategoryId,
        isFeatured,
        feedbackId,
    } = parsed.data;

    try {
        const categoryEnum = category as ProductType;

        // ✅ 檢查精選上限
        if (isFeatured) {
            const count = await db.tourProduct.count({
                where: { isFeatured: true, category: categoryEnum },
            });
            if (count >= 6) {
                return { error: `「${categoryEnum}」類別的精選最多只能有六筆` };
            }
        }

        const safeDays = toSafeNumber(days);

        const product = await db.tourProduct.create({
            data: {
                code,
                namePrefix: namePrefix || null,
                name,
                mainImageUrl,
                summary: summary || null,
                description: description || null,
                days: safeDays,
                nights: toSafeNumber(nights),
                departAirport,
                arriveCountry,
                arriveCity,
                arriveAirport,
                category: categoryEnum,
                priceMin: toSafeNumber(priceMin),
                priceMax: toSafeNumber(priceMax),
                tags: tags ?? [],
                countries: countries ?? [],
                note: note || null,
                memo: memo || null,         // ✅ 新增
                deposit: deposit || null,   // ✅ 新增
                status,
                staff: staff || null,
                reminder: reminder || null,
                policy: policy || null,
                categoryId,
                subCategoryId: subCategoryId || null,
                isFeatured: isFeatured ?? false,
                feedbackId: feedbackId || null,

                // ✅ 同步建立行程天數
                itineraries: {
                    create: Array.from({ length: safeDays }).map((_, i) => ({
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

/** ✅ 更新 TourProduct 的精選狀態 */
export async function toggleFeatured(id: string, isFeatured: boolean) {
    if (!id) return { error: '無效的 ID' };

    try {
        const product = await db.tourProduct.findUnique({ where: { id } });
        if (!product) return { error: '找不到產品' };

        if (isFeatured) {
            const count = await db.tourProduct.count({
                where: {
                    isFeatured: true,
                    category: product.category as ProductType,
                },
            });
            if (count >= 6) {
                return {
                    error: `「${product.category}」類別的精選最多只能有六筆`,
                };
            }
        }

        const updated = await db.tourProduct.update({
            where: { id },
            data: { isFeatured },
        });

        return { success: '已更新精選狀態', data: updated };
    } catch (err) {
        console.error('toggleFeatured error:', err);
        return { error: '更新精選狀態失敗' };
    }
}

/** ✅ 編輯 TourProduct */
export async function editTourProduct(id: string, values: TourProductEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = TourProductEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    // 同時載入現有行程
    const exists = await db.tourProduct.findUnique({
        where: { id },
        include: { itineraries: true },
    });
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
        countries,
        note,
        memo,        // ✅ 新增
        deposit,     // ✅ 新增
        status,
        staff,
        reminder,
        policy,
        categoryId,
        subCategoryId,
        isFeatured,
        feedbackId,
    } = parsed.data;

    try {
        const categoryEnum = category as ProductType;

        // ✅ 若圖片更換 → 刪除舊檔
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

        // ✅ 檢查精選上限
        if (isFeatured) {
            const count = await db.tourProduct.count({
                where: { isFeatured: true, category: categoryEnum },
            });
            if (count >= 6 && !exists.isFeatured) {
                return { error: `「${categoryEnum}」類別的精選最多只能有六筆` };
            }
        }

        // ✅ 更新主體資料
        const product = await db.tourProduct.update({
            where: { id },
            data: {
                code,
                namePrefix: namePrefix || null,
                name,
                mainImageUrl,
                summary: summary || null,
                description: description || null,
                days: toSafeNumber(days),
                nights: toSafeNumber(nights),
                departAirport,
                arriveCountry,
                arriveCity,
                arriveAirport,
                category: categoryEnum,
                priceMin: toSafeNumber(priceMin),
                priceMax: toSafeNumber(priceMax),
                tags: tags ?? [],
                countries: countries ?? [],
                note: note || null,
                memo: memo || null,         // ✅ 新增
                deposit: deposit || null,   // ✅ 新增
                status,
                staff: staff || null,
                reminder: reminder || null,
                policy: policy || null,
                categoryId,
                subCategoryId: subCategoryId || null,
                isFeatured: isFeatured ?? false,
                feedbackId: feedbackId || null,
            },
        });

        // ✅ 同步行程天數
        const oldDays = exists.days ?? 0;
        const newDays = toSafeNumber(days);

        if (newDays > oldDays) {
            const toCreate = Array.from(
                { length: newDays - oldDays },
                (_, i) => ({
                    productId: id,
                    day: oldDays + i + 1,
                    title: `Day ${oldDays + i + 1}`,
                })
            );
            await db.itinerary.createMany({ data: toCreate });
        } else if (newDays < oldDays) {
            await db.itinerary.deleteMany({
                where: { productId: id, day: { gt: newDays } },
            });
        }

        return { success: '行程更新成功', data: product };
    } catch (err) {
        console.error('editTourProduct error:', err);
        return { error: '行程更新失敗' };
    }
}

/** ✅ 刪除 TourProduct */
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
        if (exists.map?.imageUrl) imageUrls.push(exists.map.imageUrl);

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
