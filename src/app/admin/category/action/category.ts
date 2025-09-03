// src/app/admin/category/action/category.ts
'use server';

import { db } from '@/lib/db';
import {
    CategoryCreateSchema,
    CategoryEditSchema,
    type CategoryCreateValues,
    type CategoryEditValues,
} from '@/schemas/category';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 Category */
export async function createCategory(values: CategoryCreateValues) {
    const parsed = CategoryCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
    const upper = code.toUpperCase();

    // 唯一性檢查
    const dup = await db.category.findUnique({ where: { code: upper } });
    if (dup) return { error: `代碼已存在：${upper}` };

    const data = await db.category.create({
        data: {
            code: upper,
            nameZh: nameZh.trim(),
            nameEn: nameEn.trim(),
            imageUrl: imageUrl === null ? null : imageUrl?.trim(),
            enabled: enabled ?? true,
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 Category（依 id，並刪除舊 Blob 圖片） */
export async function editCategory(id: string, values: CategoryEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = CategoryEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.category.findUnique({ where: { id } });
    if (!exists) return { error: '找不到大類別資料' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;

    // 若更新 code，需檢查唯一
    if (code !== undefined) {
        const upper = code.toUpperCase();
        if (upper !== exists.code) {
            const dup = await db.category.findUnique({ where: { code: upper } });
            if (dup) return { error: `代碼已存在：${upper}` };
        }
    }

    // ⚡ 如果 imageUrl 被更新，且與舊的不一樣，就刪掉舊 Blob
    if (imageUrl !== undefined && exists.imageUrl && exists.imageUrl !== imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    const patch: {
        code?: string;
        nameZh?: string;
        nameEn?: string;
        imageUrl?: string | null;
        enabled?: boolean;
    } = {};

    if (code !== undefined) patch.code = code.toUpperCase();
    if (nameZh !== undefined) patch.nameZh = nameZh.trim();
    if (nameEn !== undefined) patch.nameEn = nameEn.trim();
    if (imageUrl !== undefined) patch.imageUrl = imageUrl === null ? null : imageUrl.trim();
    if (enabled !== undefined) patch.enabled = enabled;

    const data = await db.category.update({ where: { id }, data: patch });

    return { success: '更新成功', data };
}

/** 刪除 Category（依 id，並刪除 Blob 圖片） */
export async function deleteCategory(id: string) {
    if (!id) return { error: '無效的 ID' };

    try {
        const exists = await db.category.findUnique({
            where: { id },
            select: { id: true, nameZh: true, imageUrl: true },
        });
        if (!exists) return { error: '找不到大類別資料' };

        // ⚡ 刪除 blob
        if (exists.imageUrl) {
            try {
                await deleteFromVercelBlob(exists.imageUrl);
            } catch (err) {
                console.error('刪除 Blob 圖片失敗:', err);
            }
        }

        const deleted = await db.category.delete({ where: { id } });

        return {
            success: `刪除成功：已刪除大類別`,
            data: deleted,
        };
    } catch (e) {
        console.error('deleteCategory error:', e);
        return { error: '刪除失敗' };
    }
}
