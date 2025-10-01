'use server';

import { db } from '@/lib/db';
import {
    FeedbackCreateSchema,
    FeedbackEditSchema,
    type FeedbackCreateValues,
    type FeedbackEditValues,
} from '@/schemas/feedback';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 建立 Feedback */
export async function createFeedback(input: FeedbackCreateValues) {
    const parsed = FeedbackCreateSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const created = await db.feedback.create({ data: parsed.data });

    const data = await db.feedback.findUnique({
        where: { id: created.id },
        include: { products: true }, // ✅ 改這裡
    });

    return { success: '新增成功', data };
}

/** 編輯 Feedback */
export async function editFeedback(id: string, input: FeedbackEditValues) {
    if (!id) return { error: '無效 ID' };

    const parsed = FeedbackEditSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.feedback.findUnique({ where: { id } });
    if (!exists) return { error: '找不到資料' };

    // ⚡ 如果更新了 imageUrl，刪除舊 blob
    if (
        parsed.data.imageUrl !== undefined &&
        exists.imageUrl &&
        exists.imageUrl !== parsed.data.imageUrl
    ) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    await db.feedback.update({
        where: { id },
        data: parsed.data,
    });

    const data = await db.feedback.findUnique({
        where: { id },
        include: { products: true },
    });

    return { success: '更新成功', data };
}

/** 刪除 Feedback */
export async function deleteFeedback(id: string) {
    if (!id) return { error: '無效 ID' };

    const exists = await db.feedback.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到資料' };

    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    const data = await db.feedback.delete({ where: { id } });
    return { success: '刪除成功', data };
}
