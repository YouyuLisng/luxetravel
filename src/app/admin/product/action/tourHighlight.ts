'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    TourHighlightSchema,
    type TourHighlightValues,
} from '@/schemas/tourHighlight';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/**
 * 取代指定產品的 Tour Highlights
 * @param productId - 產品 ID
 * @param highlights - 新亮點資料
 */
export async function replaceTourHighlights(
    productId: string,
    highlights: TourHighlightValues[]
) {
    const parsed = z.array(TourHighlightSchema).safeParse(highlights);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    console.log('replaceTourHighlights parsed:', parsed.data);

    try {
        const old = await db.tourHighlight.findMany({ where: { productId } });

        // ✅ 去重並保留合法的圖片網址
        const urlsToDelete = [
            ...new Set(
                old
                    .flatMap((h) => h.imageUrls)
                    .filter(
                        (url) => typeof url === 'string' && url.trim() !== ''
                    )
            ),
        ];

        // ✅ 平行刪除舊圖片
        const deleteResults = await Promise.allSettled(
            urlsToDelete.map(async (url) => {
                try {
                    await deleteFromVercelBlob(url);
                    return { url, success: true };
                } catch (err) {
                    console.warn('刪除舊圖片失敗:', url, err);
                    return { url, success: false };
                }
            })
        );

        const successCount = deleteResults.filter(
            (r) => r.status === 'fulfilled'
        ).length;
        console.log(
            `🧹 已刪除 ${successCount}/${urlsToDelete.length} 張舊圖片`
        );

        // ✅ 清除舊資料
        await db.tourHighlight.deleteMany({ where: { productId } });

        // ✅ 新增新亮點資料
        if (parsed.data.length > 0) {
            await db.tourHighlight.createMany({
                data: parsed.data.map((h) => ({
                    productId,
                    imageUrls: (h.imageUrls ?? []).filter(
                        (url): url is string =>
                            typeof url === 'string' && url.trim() !== ''
                    ),
                    layout: h.layout,
                    title: h.title,
                    subtitle: h.subtitle ?? null,
                    content: h.content ?? null,
                    order: h.order,
                })),
            });
        }

        return { success: '亮點已更新成功' };
    } catch (err) {
        console.error('replaceTourHighlights error:', err);
        return { error: '亮點更新失敗' };
    }
}
