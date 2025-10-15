import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{ id: string }>;
}

/* ------------------------- 取得單筆 CountryShowcase ------------------------- */
export async function GET(_request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const item = await db.countryShowcase.findUnique({
            where: { id },
            include: {
                tourProducts: {
                    include: {
                        tourProduct: {
                            select: {
                                id: true,
                                mainImageUrl: true,
                                code: true,
                                namePrefix: true,
                                name: true,
                                summary: true,
                                tags: true,
                                countries: true,
                                category: true,
                                arriveCountry: true,
                                days: true,
                                nights: true,
                                priceMin: true,
                                priceMax: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        if (!item) {
            return NextResponse.json(
                { error: `Country Showcase with ID ${id} not found` },
                { status: 404 }
            );
        }

        // ✅ 欄位重新命名
        const bookImage = item.imageUrl;
        const landscapeImage = item.imageUrl2;

        // ✅ 分類 products
        const groupProducts: any[] = [];
        const freeProducts: any[] = [];
        const rcarProducts: any[] = [];

        for (const tp of item.tourProducts ?? []) {
            const p = tp.tourProduct;
            if (!p) continue;
            if (p.category === 'GROUP') groupProducts.push(p);
            else if (p.category === 'FREE') freeProducts.push(p);
            else if (p.category === 'RCAR') rcarProducts.push(p);
        }

        return NextResponse.json({
            status: true,
            message: `成功取得 Country Showcase「${item.title}」`,
            data: {
                id: item.id,
                bookImage,
                landscapeImage,
                title: item.title,
                subtitle: item.subtitle,
                description: item.description,
                linkText: item.linkText,
                linkUrl: item.linkUrl,
                order: item.order,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                groupProducts,
                freeProducts,
                rcarProducts, // ✅ 改名完成
            },
        });
    } catch (error) {
        console.error('Error fetching country showcase:', error);
        return NextResponse.json(
            { error: 'Failed to fetch country showcase' },
            { status: 500 }
        );
    }
}

/* ------------------------- 更新單筆 CountryShowcase ------------------------- */
export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
        bookImage,
        landscapeImage,
        imageUrl,
        imageUrl1,
        imageUrl2,
        title,
        subtitle,
        description,
        linkText,
        linkUrl,
        order,
    } = body;

    // ✅ 兼容 bookImage 或 imageUrl
    const mainImage = bookImage || imageUrl;
    const wideImage = landscapeImage || imageUrl2;

    if (!mainImage || !title) {
        return NextResponse.json(
            { error: '缺少必要欄位（bookImage, title）' },
            { status: 400 }
        );
    }

    try {
        const updated = await db.countryShowcase.update({
            where: { id },
            data: {
                imageUrl: mainImage,
                imageUrl1: imageUrl1 || null,
                imageUrl2: wideImage || null,
                title,
                subtitle: subtitle || null,
                description: description || null,
                linkText: linkText || null,
                linkUrl: linkUrl || null,
                order: order ?? 0,
            },
        });

        return NextResponse.json({
            status: true,
            message: `Country Showcase「${updated.title}」更新成功`,
            data: {
                id: updated.id,
                bookImage: updated.imageUrl,
                landscapeImage: updated.imageUrl2,
                title: updated.title,
                subtitle: updated.subtitle,
                description: updated.description,
                linkText: updated.linkText,
                linkUrl: updated.linkUrl,
                order: updated.order,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error updating country showcase:', error);
        return NextResponse.json(
            { error: 'Failed to update country showcase' },
            { status: 500 }
        );
    }
}

/* ------------------------- 刪除單筆 CountryShowcase ------------------------- */
export async function DELETE(_request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const deleted = await db.countryShowcase.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: `Country Showcase「${deleted.title}」已成功刪除`,
            data: {
                id: deleted.id,
                title: deleted.title,
                order: deleted.order,
                createdAt: deleted.createdAt,
                updatedAt: deleted.updatedAt,
            },
        });
    } catch (error) {
        console.error('Error deleting country showcase:', error);
        return NextResponse.json(
            { error: 'Failed to delete country showcase' },
            { status: 500 }
        );
    }
}
