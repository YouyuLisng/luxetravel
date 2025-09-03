'use server';

import { db } from '@/lib/db';
import { z } from 'zod';
import {
    CountryShowcaseCreateSchema,
    CountryShowcaseEditSchema,
    type CountryShowcaseCreateValues,
    type CountryShowcaseEditValues,
} from '@/schemas/countryShowcase';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 CountryShowcase */
export async function createCountryShowcase(
    values: CountryShowcaseCreateValues
) {
    const parsed = CountryShowcaseCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { imageUrl, title, subtitle, description, linkText, linkUrl, order } =
        parsed.data;

    const data = await db.countryShowcase.create({
        data: {
            imageUrl,
            title,
            subtitle: subtitle || null,
            description: description || null,
            linkText: linkText || null,
            linkUrl: linkUrl || null,
            order,
        },
    });

    return { success: '新增成功', data };
}

/** 編輯 CountryShowcase（依 id，並刪除舊 blob 圖片） */
export async function editCountryShowcase(
    id: string,
    values: CountryShowcaseEditValues
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = CountryShowcaseEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.countryShowcase.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 CountryShowcase' };

    const { imageUrl, title, subtitle, description, linkText, linkUrl, order } =
        parsed.data;

    // ⚡ 如果換圖，刪掉舊 blob
    if (imageUrl !== undefined && exists.imageUrl && exists.imageUrl !== imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    const data = await db.countryShowcase.update({
        where: { id },
        data: {
            imageUrl,
            title,
            subtitle: subtitle || null,
            description: description || null,
            linkText: linkText || null,
            linkUrl: linkUrl || null,
            order,
        },
    });

    return { success: '更新成功', data };
}

/** 刪除 CountryShowcase（依 id，並刪除 blob 圖片） */
export async function deleteCountryShowcase(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.countryShowcase.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 CountryShowcase' };

    // ⚡ 刪除舊圖片
    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    const data = await db.countryShowcase.delete({ where: { id } });
    return { success: '刪除成功', data };
}
