import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/admin/article-countries
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, nameZh, code } = body;

        if (!name) {
            return NextResponse.json(
                { error: 'Missing name' },
                { status: 400 }
            );
        }
        if (!nameZh) {
            return NextResponse.json(
                { error: 'Missing nameZh' },
                { status: 400 }
            );
        }
        if (!code) {
            return NextResponse.json(
                { error: 'Missing code' },
                { status: 400 }
            );
        }

        const country = await db.articleCountry.create({
            data: { name, nameZh, code },
        });

        return NextResponse.json(
            {
                success: true,
                message: `Country「${country.name} / ${country.nameZh}」建立成功`,
                data: country,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating country:', error);
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { error: 'Country 已存在（name 重複）' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// GET /api/admin/article-countries?page=&pageSize=&q=
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );
        const q = searchParams.get('q');

        const where: any = {};
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { nameZh: { contains: q, mode: 'insensitive' } },
                { code: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [total, rows] = await Promise.all([
            db.articleCountry.count({ where }),
            db.articleCountry.findMany({
                where,
                orderBy: { name: 'asc' },
                include: {
                    articles: { include: { article: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const data = rows.map((row) => ({
            id: row.id,
            name: row.name,
            nameZh: row.nameZh,
            code: row.code,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            articles: row.articles.map((ac) => ({
                id: ac.article.id,
                title: ac.article.title,
                subtitle: ac.article.subtitle,
                linkUrl: ac.article.linkUrl,
                imageUrl: ac.article.imageUrl,
                createdAt: ac.article.createdAt,
                updatedAt: ac.article.updatedAt,
            })),
        }));

        return NextResponse.json({
            rows: data,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.max(1, Math.ceil(total / pageSize)),
            },
        });
    } catch (error) {
        console.error('Error fetching article countries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch article countries' },
            { status: 500 }
        );
    }
}
