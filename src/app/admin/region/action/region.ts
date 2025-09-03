'use server';

import { db } from '@/lib/db';
import {
    RegionCreateSchema,
    RegionEditSchema,
    type RegionCreateValues,
    type RegionEditValues,
} from '@/schemas/region';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 Region */
export async function createRegion(values: RegionCreateValues) {
    const parsed = RegionCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
    const upper = code.toUpperCase();

    // 唯一性檢查
    const dup = await db.region.findUnique({ where: { code: upper } });
    if (dup) return { error: `代碼已存在：${upper}` };

    const data = await db.region.create({
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

/** 編輯 Region（依 id，並刪除舊 blob 圖片） */
export async function editRegion(id: string, values: RegionEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = RegionEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.region.findUnique({ where: { id } });
    if (!exists) return { error: '找不到地區資料' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;

    // 若更新 code，需檢查唯一
    if (code !== undefined) {
        const upper = code.toUpperCase();
        if (upper !== exists.code) {
            const dup = await db.region.findUnique({ where: { code: upper } });
            if (dup) return { error: `代碼已存在：${upper}` };
        }
    }

    // ⚡ 如果更新 imageUrl 且與舊的不同 → 刪除舊 blob
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

    const data = await db.region.update({ where: { id }, data: patch });

    return { success: '更新成功', data };
}

/** 刪除 Region（依 id，並刪除 blob 圖片） */
export async function deleteRegion(id: string) {
    if (!id) return { error: '無效的 ID' };

    try {
        const exists = await db.region.findUnique({
            where: { id },
            select: { id: true, nameZh: true, imageUrl: true },
        });
        if (!exists) return { error: '找不到地區資料' };

        // ⚡ 刪除圖片
        if (exists.imageUrl) {
            try {
                await deleteFromVercelBlob(exists.imageUrl);
            } catch (err) {
                console.error('刪除 Blob 圖片失敗:', err);
            }
        }

        const { deleted, removedCount } = await db.$transaction(async (tx) => {
            const removed = await tx.airport.deleteMany({
                where: { regionId: id },
            });
            const deleted = await tx.region.delete({ where: { id } });
            return { deleted, removedCount: removed.count };
        });

        return {
            success: `刪除成功：已刪除地區「${deleted.nameZh}」共 ${removedCount} 筆`,
            data: deleted,
        };
    } catch (e) {
        console.error('deleteRegion error:', e);
        return { error: '刪除失敗' };
    }
}
