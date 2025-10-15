'use server';

import { db } from '@/lib/db';
import {
    AirlineCreateSchema,
    AirlineEditSchema,
    type AirlineCreateValues,
    type AirlineEditValues,
} from '@/schemas/airline';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';
/** 新增 Airline（檢查唯一碼） */
export async function createAirline(values: AirlineCreateValues) {
    const parsed = AirlineCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
    const upper = code.toUpperCase();

    // 航空公司代碼唯一
    const dup = await db.airline.findUnique({ where: { code: upper } });
    if (dup) return { error: `代碼已存在：${upper}` };

    const data = await db.airline.create({
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

/** 編輯 Airline（依 id） */
export async function editAirline(id: string, values: AirlineEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = AirlineEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.airline.findUnique({
        where: { id },
        select: { id: true, code: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 Airline' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;

    // 若更新代碼，先做唯一檢查
    if (code !== undefined) {
        const up = code.toUpperCase();
        if (up !== exists.code) {
            const dup = await db.airline.findUnique({ where: { code: up } });
            if (dup) return { error: `代碼已存在：${up}` };
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
    if (enabled !== undefined) patch.enabled = enabled;

    // 🟢 如果傳入新 imageUrl，且與舊圖不同 → 刪掉舊的 Blob
    if (imageUrl !== undefined) {
        const newUrl = imageUrl === null ? null : imageUrl.trim();
        patch.imageUrl = newUrl;

        if (newUrl && exists.imageUrl && exists.imageUrl !== newUrl) {
            await deleteFromVercelBlob(exists.imageUrl);
        }
    }

    const data = await db.airline.update({ where: { id }, data: patch });
    return { success: '更新成功', data };
}

/** 刪除 Airline（依 id） */
export async function deleteAirline(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.airline.findUnique({
        where: { id },
        select: { id: true, imageUrl: true }, // 👈 取出 imageUrl
    });
    if (!exists) return { error: '找不到 Airline' };

    // 如果有圖片 → 先刪除 Blob 檔案
    if (exists.imageUrl) {
        await deleteFromVercelBlob(exists.imageUrl);
    }

    // 再刪 DB
    const data = await db.airline.delete({ where: { id } });
    return { success: '刪除成功', data };
}
