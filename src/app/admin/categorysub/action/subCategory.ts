// src/app/admin/subCategory/action/subCategory.ts
'use server';

import { db } from '@/lib/db';
import {
    SubCategoryCreateSchema,
    SubCategoryEditSchema,
    type SubCategoryCreateValues,
    type SubCategoryEditValues,
} from '@/schemas/subCategory';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 SubCategory */
export async function createSubCategory(values: SubCategoryCreateValues) {
    const parsed = SubCategoryCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, imageUrl, enabled, categoryId } = parsed.data;
    const upper = code.toUpperCase();

    // 檢查代碼唯一性
    const dup = await db.subCategory.findUnique({ where: { code: upper } });
    if (dup) return { error: `代碼已存在：${upper}` };

    // 確認 Category 是否存在
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) return { error: '找不到所屬的 Category' };

    const data = await db.subCategory.create({
        data: {
            code: upper,
            nameZh: nameZh.trim(),
            nameEn: nameEn.trim(),
            imageUrl: imageUrl === null ? null : imageUrl?.trim(),
            enabled: enabled ?? true,
            categoryId,
        },
        include: { category: true },
    });

    return { success: '新增成功', data };
}

/** 編輯 SubCategory（依 id，並刪除舊 blob 圖片） */
export async function editSubCategory(
    id: string,
    values: SubCategoryEditValues
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = SubCategoryEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.subCategory.findUnique({ where: { id } });
    if (!exists) return { error: '找不到小類別資料' };

    const { code, nameZh, nameEn, imageUrl, enabled, categoryId } = parsed.data;

    // 檢查代碼唯一性
    if (code !== undefined) {
        const upper = code.toUpperCase();
        if (upper !== exists.code) {
            const dup = await db.subCategory.findUnique({ where: { code: upper } });
            if (dup) return { error: `代碼已存在：${upper}` };
        }
    }

    // 如果有更新 categoryId，需確認 Category 存在
    if (categoryId !== undefined) {
        const category = await db.category.findUnique({ where: { id: categoryId } });
        if (!category) return { error: '找不到所屬的 Category' };
    }

    // ⚡ 如果更新了 imageUrl 且不同，刪除舊 Blob
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
        categoryId?: string;
    } = {};

    if (code !== undefined) patch.code = code.toUpperCase();
    if (nameZh !== undefined) patch.nameZh = nameZh.trim();
    if (nameEn !== undefined) patch.nameEn = nameEn.trim();
    if (imageUrl !== undefined) patch.imageUrl = imageUrl === null ? null : imageUrl.trim();
    if (enabled !== undefined) patch.enabled = enabled;
    if (categoryId !== undefined) patch.categoryId = categoryId;

    const data = await db.subCategory.update({
        where: { id },
        data: patch,
        include: { category: true },
    });

    return { success: '更新成功', data };
}

/** 刪除 SubCategory（依 id，並刪除 blob 圖片） */
export async function deleteSubCategory(id: string) {
    if (!id) return { error: '無效的 ID' };

    try {
        const exists = await db.subCategory.findUnique({
            where: { id },
            select: { id: true, nameZh: true, imageUrl: true },
        });
        if (!exists) return { error: '找不到小類別資料' };

        // ⚡ 刪除舊圖片
        if (exists.imageUrl) {
            try {
                await deleteFromVercelBlob(exists.imageUrl);
            } catch (err) {
                console.error('刪除 Blob 圖片失敗:', err);
            }
        }

        const deleted = await db.subCategory.delete({ where: { id } });

        return {
            success: `刪除成功：已刪除小類別`,
            data: deleted,
        };
    } catch (e) {
        console.error('deleteSubCategory error:', e);
        return { error: '刪除失敗' };
    }
}
