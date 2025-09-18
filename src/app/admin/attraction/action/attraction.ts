'use server';

import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import {
    AttractionCreateSchema,
    AttractionEditSchema,
    type AttractionCreateValues,
    type AttractionEditValues,
} from '@/schemas/attraction';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 Attraction（僅檢查 code 唯一） */
export async function createAttraction(values: AttractionCreateValues) {
    const parsed = AttractionCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const data = parsed.data;
    console.log("data:", data)
    // 如果有輸入 code → 檢查唯一性
    if (data.code) {
        const up = data.code.toUpperCase();
        const dup = await db.attraction.findUnique({ where: { code: up } });
        if (dup) return { error: `代碼已存在：${up}` };
        data.code = up;
    } else {
        // 沒有輸入 code → 系統產生 UUID
        data.code = randomUUID().toUpperCase();
    }

    const created = await db.attraction.create({ data });
    return { success: '新增成功', data: created };
}

/** 編輯 Attraction（依 id；僅檢查 code 唯一，並刪舊 Blob 圖片） */
export async function editAttraction(id: string, values: AttractionEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = AttractionEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const data = parsed.data;
    console.log("edit data:", data)
    // 找現有資料
    const exists = await db.attraction.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Attraction' };

    // 檢查 code 唯一（有更新且不同才檢查）
    if (data.code !== undefined && data.code !== null) {
        const up = data.code.toUpperCase();
        if (up !== exists.code) {
            const dup = await db.attraction.findUnique({ where: { code: up } });
            if (dup) return { error: `代碼已存在：${up}` };
        }
        data.code = up;
    }

    // 若更新 imageUrl 且不同 → 刪除舊 Blob
    if (
        data.imageUrl !== undefined &&
        exists.imageUrl &&
        exists.imageUrl !== data.imageUrl
    ) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    const updated = await db.attraction.update({ where: { id }, data });
    return { success: '更新成功', data: updated };
}

/** 刪除 Attraction（依 id，並刪除 Blob 圖片） */
export async function deleteAttraction(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.attraction.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 Attraction' };

    // 先刪 Blob 圖片
    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    const deleted = await db.attraction.delete({ where: { id } });
    return { success: '刪除成功', data: deleted };
}
