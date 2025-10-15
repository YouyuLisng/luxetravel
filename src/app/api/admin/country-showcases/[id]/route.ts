import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

/** 取得單筆 CountryShowcase */
export async function GET(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const item = await db.countryShowcase.findUnique({ where: { id } });

        if (!item) {
            return NextResponse.json(
                { error: `Country Showcase with ID ${id} not found` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            data: item,
        });
    } catch (error) {
        console.error('Error fetching country showcase:', error);
        return NextResponse.json(
            { error: 'Failed to fetch country showcase' },
            { status: 500 }
        );
    }
}

/** 更新單筆 CountryShowcase */
export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
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

    if (!imageUrl || !title) {
        return NextResponse.json(
            { error: '缺少必要欄位（imageUrl, title）' },
            { status: 400 }
        );
    }

    try {
        const updated = await db.countryShowcase.update({
            where: { id },
            data: {
                imageUrl,
                imageUrl1: imageUrl1 || null,
                imageUrl2: imageUrl2 || null,
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
            data: updated,
        });
    } catch (error) {
        console.error('Error updating country showcase:', error);
        return NextResponse.json(
            { error: 'Failed to update country showcase' },
            { status: 500 }
        );
    }
}

/** 刪除單筆 CountryShowcase */
export async function DELETE(request: NextRequest, { params }: Props) {
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
            data: deleted,
        });
    } catch (error) {
        console.error('Error deleting country showcase:', error);
        return NextResponse.json(
            { error: 'Failed to delete country showcase' },
            { status: 500 }
        );
    }
}
