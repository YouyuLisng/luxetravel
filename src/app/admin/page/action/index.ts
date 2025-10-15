'use server';

import { db } from '@/lib/db';
import {
    PageCreateSchema,
    PageEditSchema,
    type PageCreateValues,
    type PageEditValues,
} from '@/schemas/page';

/** 新增 Page（可同時關聯 TourProducts） */
export async function createPage(
    values: PageCreateValues,
    productIds: string[]
) {
    const parsed = PageCreateSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const {
        title,
        slug,
        content,
        seoTitle,
        seoDesc,
        seoImage,
        keywords,
        icon,
        activityTextEn,
    } = parsed.data;

    // Slug 唯一檢查
    const dup = await db.page.findUnique({ where: { slug } });
    if (dup) return { error: `Slug 已存在：${slug}` };

    const data = await db.page.create({
        data: {
            title: title.trim(),
            slug: slug.trim(),
            content: content ?? null,
            seoTitle: seoTitle ?? null,
            seoDesc: seoDesc ?? null,
            seoImage: seoImage === null ? null : seoImage?.trim(),
            keywords: keywords ?? [],
            icon: icon === null ? null : icon?.trim(),
            activityTextEn: activityTextEn ?? null,
            tourProducts: {
                create: productIds.map((pid) => ({
                    tourProduct: { connect: { id: pid } },
                })),
            },
        },
        include: { tourProducts: { include: { tourProduct: true } } },
    });

    return { success: '新增成功', data };
}

/** 編輯 Page（可更新並替換 TourProducts） */
export async function editPage(
    id: string,
    values: PageEditValues,
    productIds: string[]
) {
    if (!id) return { error: '無效的 ID' };

    const parsed = PageEditSchema.safeParse(values);
    if (!parsed.success) return { error: '欄位格式錯誤' };

    const exists = await db.page.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Page' };

    const patch = {
        title: values.title,
        slug: values.slug,
        content: values.content,
        seoTitle: values.seoTitle,
        seoDesc: values.seoDesc,
        seoImage: values.seoImage ?? null,
        keywords: values.keywords ?? [],
        icon: values.icon === null ? null : values.icon?.trim(),
        activityTextEn: values.activityTextEn ?? null,
    };

    const data = await db.page.update({
        where: { id },
        data: {
            ...patch,
            tourProducts: {
                deleteMany: {},
                create: productIds.map((pid) => ({
                    tourProduct: { connect: { id: pid } },
                })),
            },
        },
        include: { tourProducts: { include: { tourProduct: true } } },
    });

    return { success: '更新成功', data };
}

/** 刪除 Page */
export async function deletePage(id: string) {
    if (!id) return { error: '無效的 ID' };

    const exists = await db.page.findUnique({ where: { id } });
    if (!exists) return { error: '找不到 Page' };

    const data = await db.page.delete({ where: { id } });
    return { success: '刪除成功', data };
}
