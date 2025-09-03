'use server';

import { db } from '@/lib/db';
import {
    FeedbackCreateSchema,
    FeedbackEditSchema,
    type FeedbackCreateValues,
    type FeedbackEditValues,
} from '@/schemas/feedback';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 建立 Feedback（可同時掛上多個 countryId） */
export async function createFeedback(input: FeedbackCreateValues) {
    const parsed = FeedbackCreateSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { countryIds, ...fields } = parsed.data;

    const created = await db.feedback.create({ data: fields });

    if (countryIds?.length) {
        const uniqueCountryIds = [...new Set(countryIds)];
        if (uniqueCountryIds.length) {
            await db.feedbackOnCountry.createMany({
                data: uniqueCountryIds.map((cid) => ({
                    feedbackId: created.id,
                    countryId: cid,
                })),
            });
        }
    }

    const data = await db.feedback.findUnique({
        where: { id: created.id },
        include: { countries: { include: { country: true } } },
    });

    return { success: '新增成功', data };
}

/** 編輯 Feedback（依 id，並可更新國家關聯與圖片） */
export async function editFeedback(id: string, input: FeedbackEditValues) {
    if (!id) return { error: '無效 ID' };

    const parsed = FeedbackEditSchema.safeParse(input);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.feedback.findUnique({ where: { id } });
    if (!exists) return { error: '找不到資料' };

    const { countryIds, ...fields } = parsed.data;

    // ⚡ 如果更新了 imageUrl，刪除舊 blob
    if (
        fields.imageUrl !== undefined &&
        exists.imageUrl &&
        exists.imageUrl !== fields.imageUrl
    ) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    // 更新主體欄位
    await db.feedback.update({ where: { id }, data: fields });

    // 覆寫國家關聯（若提供 countryIds）
    if (countryIds) {
        const current = await db.feedbackOnCountry.findMany({
            where: { feedbackId: id },
            select: { countryId: true },
        });
        const currentSet = new Set(current.map((c) => c.countryId));
        const nextSet = new Set(countryIds);

        const toAdd = [...nextSet].filter((cid) => !currentSet.has(cid));
        const toDel = [...currentSet].filter((cid) => !nextSet.has(cid));

        if (toDel.length) {
            await db.feedbackOnCountry.deleteMany({
                where: { feedbackId: id, countryId: { in: toDel } },
            });
        }
        if (toAdd.length) {
            const uniqueToAdd = [...new Set(toAdd)];
            await db.feedbackOnCountry.createMany({
                data: uniqueToAdd.map((cid) => ({
                    feedbackId: id,
                    countryId: cid,
                })),
            });
        }
    }

    const data = await db.feedback.findUnique({
        where: { id },
        include: { countries: { include: { country: true } } },
    });

    return { success: '更新成功', data };
}

/** 刪除 Feedback（並刪除 blob 圖片；onDelete: Cascade 清關聯） */
export async function deleteFeedback(id: string) {
    if (!id) return { error: '無效 ID' };

    const exists = await db.feedback.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到資料' };

    // ⚡ 刪除圖片
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

/** 重新排序 */
export async function reorderFeedback(idsInOrder: string[]) {
    if (!Array.isArray(idsInOrder) || idsInOrder.length === 0) {
        return { error: '無效的排序清單' };
    }

    await db.$transaction(
        idsInOrder.map((id, idx) =>
            db.feedback.update({
                where: { id },
                data: { order: idx },
            })
        )
    );

    return { success: '排序已更新' };
}
