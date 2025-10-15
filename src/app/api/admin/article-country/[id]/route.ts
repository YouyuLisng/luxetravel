// /app/api/countries/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const row = await db.articleCountry.findUnique({
            where: { id },
            include: {
                articles: { include: { article: true } },
            },
        });

        if (!row) {
            return NextResponse.json(
                { error: 'Country 不存在' },
                { status: 404 }
            );
        }

        const data = {
            id: row.id,
            name: row.name,
            nameZh: row.nameZh,
            code: row.code,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            articles: row.articles
                .filter((ac) => !!ac.article)
                .map((ac) => ({
                    id: ac.article.id,
                    title: ac.article.title,
                    subtitle: ac.article.subtitle,
                    linkUrl: ac.article.linkUrl,
                    imageUrl: ac.article.imageUrl,
                    createdAt: ac.article.createdAt,
                    updatedAt: ac.article.updatedAt,
                })),
        };

        return NextResponse.json(
            {
                status: true,
                message: `已取得 Country「${data.nameZh || data.name || data.id}」`,
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch country' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nameZh, code } = body;

    try {
        const updated = await db.articleCountry.update({
            where: { id },
            data: { name, nameZh, code },
        });

        return NextResponse.json({
            status: true,
            message: `Country「${updated.name} / ${updated.nameZh}」更新成功`,
            data: updated,
        });
    } catch (error: any) {
        console.error(error);
        if (error?.code === 'P2025') {
            return NextResponse.json(
                { error: 'Country 不存在' },
                { status: 404 }
            );
        }
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { error: '更新失敗：唯一鍵重複' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update country' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        // 清除 Join 關聯
        await db.travelArticleOnCountry.deleteMany({
            where: { countryId: id },
        });

        const deleted = await db.articleCountry.delete({ where: { id } });

        return NextResponse.json({
            status: true,
            message: `Country「${deleted.name} / ${deleted.nameZh}」已成功刪除`,
            data: deleted,
        });
    } catch (error: any) {
        console.error(error);
        if (error?.code === 'P2025') {
            return NextResponse.json(
                { error: 'Country 不存在或已刪除' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete country' },
            { status: 500 }
        );
    }
}
