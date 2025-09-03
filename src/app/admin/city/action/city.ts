'use server';

import { db } from '@/lib/db';
import {
    CityCreateSchema,
    CityEditSchema,
    type CityCreateValues,
    type CityEditValues,
} from '@/schemas/city';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 City（檢查唯一碼） */
export async function createCity(values: CityCreateValues) {
    const parsed = CityCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, country, imageUrl, enabled } = parsed.data;
    const upper = code.toUpperCase();

    // 城市代碼唯一
    const dup = await db.city.findUnique({ where: { code: upper } });
    if (dup) return { error: `代碼已存在：${upper}` };

    const data = await db.city.create({
        data: {
            code: upper,
            nameZh: nameZh.trim(),
            nameEn: nameEn.trim(),
            country: country.trim(),
            imageUrl: imageUrl === null ? null : imageUrl?.trim(),
            enabled: enabled ?? true,
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 City（依 id，並刪除舊 blob 圖片） */
export async function editCity(id: string, values: CityEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = CityEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.city.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 City' };

    const { code, nameZh, nameEn, country, imageUrl, enabled } = parsed.data;

    // 若更新代碼，先做唯一檢查
    if (code !== undefined) {
        const up = code.toUpperCase();
        if (up !== exists.code) {
            const dup = await db.city.findUnique({ where: { code: up } });
            if (dup) return { error: `代碼已存在：${up}` };
        }
    }

    // ⚡ 如果更新了 imageUrl 且不同 → 刪掉舊 blob
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
        country?: string;
        imageUrl?: string | null;
        enabled?: boolean;
    } = {};

    if (code !== undefined) patch.code = code.toUpperCase();
    if (nameZh !== undefined) patch.nameZh = nameZh.trim();
    if (nameEn !== undefined) patch.nameEn = nameEn.trim();
    if (country !== undefined) patch.country = country.trim();
    if (imageUrl !== undefined) patch.imageUrl = imageUrl === null ? null : imageUrl.trim();
    if (enabled !== undefined) patch.enabled = enabled;

    const data = await db.city.update({ where: { id }, data: patch });
    return { success: '更新成功', data };
}

/** 刪除 City（依 id，並刪除 blob 圖片） */
export async function deleteCity(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.city.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 City' };

    // ⚡ 刪除 blob
    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    const data = await db.city.delete({ where: { id } });
    return { success: '刪除成功', data };
}
