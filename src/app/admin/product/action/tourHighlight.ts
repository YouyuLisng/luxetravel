'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
  TourHighlightSchema,
  type TourHighlightValues,
} from '@/schemas/tourHighlight';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

export async function replaceTourHighlights(
  productId: string,
  highlights: TourHighlightValues[]
) {
  const parsed = z.array(TourHighlightSchema).safeParse(highlights);
  if (!parsed.success) return { error: '欄位格式錯誤' };

  console.log('replaceTourHighlights parsed:', parsed.data);

  try {
    const old = await db.tourHighlight.findMany({ where: { productId } });

    // 去重 + 平行刪除舊圖片
    const urlsToDelete = [...new Set(old.flatMap((h) => h.imageUrls))];
    await Promise.allSettled(
      urlsToDelete.map(async (url) => {
        try {
          await deleteFromVercelBlob(url);
        } catch (err) {
          console.warn('刪除舊圖片失敗:', url, err);
        }
      })
    );

    await db.tourHighlight.deleteMany({ where: { productId } });

    if (parsed.data.length > 0) {
      await db.tourHighlight.createMany({
        data: parsed.data.map((h) => ({
          productId,
          imageUrls: (h.imageUrls ?? []).filter(
            (url): url is string => typeof url === 'string' && url.trim() !== ''
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
