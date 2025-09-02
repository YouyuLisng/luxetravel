// src/app/admin/country/action/country.ts
'use server';

import { db } from '@/lib/db';
import {
    CountryCreateSchema,
    CountryEditSchema,
    type CountryCreateValues,
    type CountryEditValues,
} from '@/schemas/country';

/** 新增 Country（同時同步 ArticleCountry + FeedbackCountry） */
export async function createCountry(values: CountryCreateValues) {
    const parsed = CountryCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
    const upper = code.toUpperCase();

    // 唯一性檢查（Country.code）
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

        // === 同步 ArticleCountry（以 name 為 unique，使用 nameEn 作為 name）
        await tx.articleCountry.upsert({
            where: { name: nameEn.trim() },
            update: { nameZh: nameZh.trim(), code: upper },
            create: { name: nameEn.trim(), nameZh: nameZh.trim(), code: upper },
        });

        // === 同步 FeedbackCountry（以 name 為 unique，使用 nameEn 作為 name）
        await tx.feedbackCountry.upsert({
            where: { name: nameEn.trim() },
            update: { nameZh: nameZh.trim(), code: upper },
            create: { name: nameEn.trim(), nameZh: nameZh.trim(), code: upper },
        });

        return country;
    });

    return { success: '新增成功', data };
}

/** 編輯 Country（依 id；同步更新 ArticleCountry + FeedbackCountry，包含改名與代碼） */
export async function editCountry(id: string, values: CountryEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = CountryEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.country.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Country' };

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;

    // 若更新 code，需檢查唯一
    if (code !== undefined) {
        const upper = code.toUpperCase();
        if (upper !== exists.code) {
            const dup = await db.country.findUnique({ where: { code: upper } });
            if (dup) return { error: `代碼已存在：${upper}` };
        }
    }

    // 計算更新後的欄位
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

    const data = await db.$transaction(async (tx) => {
        // 1) 先更新 Country
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

        // 2) 同步 ArticleCountry
        const oldNameEn = exists.nameEn;
        const oldArticle = await tx.articleCountry.findUnique({
            where: { name: oldNameEn },
        });

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

        // 3) 同步 FeedbackCountry（邏輯同上）
        const oldFeedback = await tx.feedbackCountry.findUnique({
            where: { name: oldNameEn },
        });

        if (oldFeedback) {
            await tx.feedbackCountry.update({
                where: { name: oldNameEn },
                data: { name: newNameEn, nameZh: newNameZh, code: newCode },
            });
        } else {
            await tx.feedbackCountry.upsert({
                where: { name: newNameEn },
                update: { nameZh: newNameZh, code: newCode },
                create: { name: newNameEn, nameZh: newNameZh, code: newCode },
            });
        }

        return updated;
    });

    return { success: '更新成功', data };
}

/** 刪除 Country（依 id）
 *  - 先刪該國家的所有 Airport，再刪 Country，避免 P2014 關聯錯誤
 *  - 不主動刪除 ArticleCountry / FeedbackCountry（避免影響既有文章/回饋關聯）
 */
export async function deleteCountry(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.country.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Country' };

    const data = await db.$transaction(async (tx) => {
        await tx.airport.deleteMany({ where: { countryId: id } });
        return await tx.country.delete({ where: { id } });
    });

    return { success: `已刪除「${data.nameZh}」及其所有機場`, data };
}
