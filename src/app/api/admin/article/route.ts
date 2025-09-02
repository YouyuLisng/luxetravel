import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
    try {
        const rows = await db.article.findMany({
            // 依需求排序（可改成 title/name 等）
            orderBy: { createdAt: 'desc' },
            include: {
                // 透過 Join 取出關聯國家
                countries: { include: { country: true } },
            },
        });

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

        return NextResponse.json({ status: true, data });
    } catch (error) {
        console.error('Failed to list articles with countries:', error);
        return NextResponse.json(
            { error: 'Failed to list articles with countries' },
            { status: 500 }
        );
    }
}
