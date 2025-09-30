'use server';

import { db } from '@/lib/db';
import {
    CountryCreateSchema,
    CountryEditSchema,
    type CountryCreateValues,
    type CountryEditValues,
} from '@/schemas/country';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

/** 新增 Country（同時同步 ArticleCountry + FeedbackCountry） */
export async function createCountry(values: CountryCreateValues) {
    const parsed = CountryCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
    const upper = code.toUpperCase();

    // 唯一性檢查
    const dup = await db.country.findUnique({ where: { code: upper } });
    if (dup) return { error: `代碼已存在：${upper}` };

    const data = await db.$transaction(async (tx) => {
        const country = await tx.country.create({
            data: {
                code: upper,
                nameZh: nameZh.trim(),
                nameEn: nameEn.trim(),
                imageUrl: imageUrl === null ? null : imageUrl?.trim(),
                enabled: enabled ?? true,
            },
        });

        // 同步 ArticleCountry
        await tx.articleCountry.upsert({
            where: { name: nameEn.trim() },
            update: { nameZh: nameZh.trim(), code: upper },
            create: { name: nameEn.trim(), nameZh: nameZh.trim(), code: upper },
        });

        return country;
    });

    return { success: '新增成功', data };
}

/** 編輯 Country（同步更新 ArticleCountry + FeedbackCountry） */
export async function editCountry(id: string, values: CountryEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = CountryEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.country.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Country' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;

    // code 唯一性檢查
    if (code !== undefined) {
        const upper = code.toUpperCase();
        if (upper !== exists.code) {
            const dup = await db.country.findUnique({ where: { code: upper } });
            if (dup) return { error: `代碼已存在：${upper}` };
        }
    }

    const newCode = code !== undefined ? code.toUpperCase() : exists.code;
    const newNameEn = nameEn !== undefined ? nameEn.trim() : exists.nameEn;
    const newNameZh = nameZh !== undefined ? nameZh.trim() : exists.nameZh;
    const newImageUrl =
        imageUrl !== undefined
            ? imageUrl === null
                ? null
                : imageUrl.trim()
            : exists.imageUrl;
    const newEnabled = enabled !== undefined ? enabled : exists.enabled;

    // ⚡ 刪除舊 blob（若有更新圖片）
    if (imageUrl !== undefined && exists.imageUrl && exists.imageUrl !== imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    const data = await db.$transaction(async (tx) => {
        const updated = await tx.country.update({
            where: { id },
            data: {
                code: newCode,
                nameEn: newNameEn,
                nameZh: newNameZh,
                imageUrl: newImageUrl,
                enabled: newEnabled,
            },
        });

        // 同步 ArticleCountry
        const oldNameEn = exists.nameEn;
        const oldArticle = await tx.articleCountry.findUnique({ where: { name: oldNameEn } });
        if (oldArticle) {
            await tx.articleCountry.update({
                where: { name: oldNameEn },
                data: { name: newNameEn, nameZh: newNameZh, code: newCode },
            });
        } else {
            await tx.articleCountry.upsert({
                where: { name: newNameEn },
                update: { nameZh: newNameZh, code: newCode },
                create: { name: newNameEn, nameZh: newNameZh, code: newCode },
            });
        }

        return updated;
    });

    return { success: '更新成功', data };
}

/** 刪除 Country（依 id，並刪除 blob 圖片） */
export async function deleteCountry(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.country.findUnique({
        where: { id },
        select: { id: true, nameZh: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 Country' };

    // ⚡ 刪除圖片
    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    const data = await db.$transaction(async (tx) => {
        await tx.airport.deleteMany({ where: { countryId: id } });
        return await tx.country.delete({ where: { id } });
    });

    return { success: `已刪除「${exists.nameZh}」及其所有機場`, data };
}
