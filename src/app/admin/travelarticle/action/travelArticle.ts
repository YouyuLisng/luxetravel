'use server';

import { db } from '@/lib/db';
import {
    ArticleCreateSchema,
    ArticleEditSchema,
    type ArticleCreateValues,
    type ArticleEditValues,
} from '@/schemas/article';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

const uniq = (arr: string[]) => Array.from(new Set(arr));

async function ensureCountriesExist(countryIds: string[]) {
    if (!countryIds.length)
        return { ok: true as const, missing: [] as string[] };
    const found = await db.articleCountry.findMany({
        where: { id: { in: countryIds } },
        select: { id: true },
    });
    const have = new Set(found.map((f) => f.id));
    const missing = countryIds.filter((id) => !have.has(id));
    return { ok: missing.length === 0, missing };
}

export async function createArticle(values: ArticleCreateValues) {
    const parsed = ArticleCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const { countryIds, ...articleData } = parsed.data;
    const ids = uniq(countryIds);

    try {
        const check = await ensureCountriesExist(ids);
        if (!check.ok)
            return { error: `Country 不存在：${check.missing.join(', ')}` };

        const created = await db.$transaction(async (tx) => {
            const article = await tx.article.create({ data: articleData });

            if (ids.length) {
                await tx.travelArticleOnCountry.createMany({
                    data: ids.map((cid) => ({
                        articleId: article.id,
                        countryId: cid,
                    })),
                });
            }
            return article;
        });

        return { success: '新增成功', data: created };
    } catch (e) {
        console.error('createArticle error:', e);
        return { error: '新增失敗' };
    }
}

export async function editArticle(id: string, values: ArticleEditValues) {
    if (!id) return { error: '無效的 ID' };

    const parsed = ArticleEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.article.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Article' };

    const { countryIds, ...articleData } = parsed.data;

    // ⚡ 如果更新了 imageUrl，刪除舊 blob
    if (
        articleData.imageUrl !== undefined &&
        exists.imageUrl &&
        exists.imageUrl !== articleData.imageUrl
    ) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除舊 Blob 圖片失敗:', err);
        }
    }

    try {
        const updated = await db.$transaction(async (tx) => {
            const a = await tx.article.update({
                where: { id },
                data: articleData,
            });

            if (countryIds) {
                const ids = uniq(countryIds);

                const check = await ensureCountriesExist(ids);
                if (!check.ok)
                    throw new Error(
                        `Country 不存在：${check.missing.join(', ')}`
                    );

                // 先移除不在新清單內的
                await tx.travelArticleOnCountry.deleteMany({
                    where: { articleId: id, NOT: { countryId: { in: ids } } },
                });

                if (ids.length) {
                    const existing = await tx.travelArticleOnCountry.findMany({
                        where: { articleId: id, countryId: { in: ids } },
                        select: { countryId: true },
                    });
                    const existSet = new Set(existing.map((e) => e.countryId));
                    const toCreate = ids
                        .filter((cid) => !existSet.has(cid))
                        .map((cid) => ({ articleId: id, countryId: cid }));

                    if (toCreate.length) {
                        await tx.travelArticleOnCountry.createMany({
                            data: toCreate,
                        });
                    }
                } else {
                    await tx.travelArticleOnCountry.deleteMany({
                        where: { articleId: id },
                    });
                }
            }

            return a;
        });

        return { success: '更新成功', data: updated };
    } catch (e: any) {
        console.error('editArticle error:', e?.message || e);
        return {
            error: e?.message?.startsWith?.('Country 不存在')
                ? e.message
                : '更新失敗',
        };
    }
}

export async function deleteArticle(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.article.findUnique({
        where: { id },
        select: { id: true, imageUrl: true },
    });
    if (!exists) return { error: '找不到 Article' };

    // ⚡ 刪除圖片
    if (exists.imageUrl) {
        try {
            await deleteFromVercelBlob(exists.imageUrl);
        } catch (err) {
            console.error('刪除 Blob 圖片失敗:', err);
        }
    }

    try {
        await db.$transaction(async (tx) => {
            await tx.travelArticleOnCountry.deleteMany({
                where: { articleId: id },
            });
            await tx.article.delete({ where: { id } });
        });
        return { success: '刪除成功' };
    } catch (e) {
        console.error('deleteArticle error:', e);
        return { error: '刪除失敗' };
    }
}
