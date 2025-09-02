import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/admin/articles
 * 支援 query: ?page=&pageSize=&q=
 */
export async function GET(req: NextRequest) {
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
                { title: { contains: q, mode: 'insensitive' } },
                { subtitle: { contains: q, mode: 'insensitive' } },
            ];
        }

        const [total, rows] = await Promise.all([
            db.article.count({ where }),
            db.article.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    countries: { include: { country: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const data = rows.map((row) => ({
            id: row.id,
            title: row.title,
            subtitle: row.subtitle,
            linkUrl: row.linkUrl,
            imageUrl: row.imageUrl,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            countries: row.countries.map((ac) => ({
                id: ac.country.id,
                name: ac.country.name,
                nameZh: ac.country.nameZh,
                code: ac.country.code,
                createdAt: ac.country.createdAt,
                updatedAt: ac.country.updatedAt,
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
        console.error('Failed to list articles with countries:', error);
        return NextResponse.json(
            { error: 'Failed to list articles with countries' },
            { status: 500 }
        );
    }
}
