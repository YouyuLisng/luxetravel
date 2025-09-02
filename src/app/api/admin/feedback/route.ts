import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.feedback.count(),
            db.feedback.findMany({
                orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
                include: {
                    countries: { include: { country: true } },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        // 扁平化 countries：只回傳 Country 詳細資料陣列
        const data = rows.map((f) => ({
            id: f.id,
            title: f.title,
            subtitle: f.subtitle,
            content: f.content,
            nickname: f.nickname,
            imageUrl: f.imageUrl,
            linkUrl: f.linkUrl,
            linekName: f.linekName,
            order: f.order,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
            countries: (f.countries ?? [])
                .filter((rel) => !!rel.country)
                .map((rel) => ({
                    id: rel.country.id,
                    name: rel.country.name,
                    nameZh: rel.country.nameZh,
                    code: rel.country.code,
                    createdAt: rel.country.createdAt,
                    updatedAt: rel.country.updatedAt,
                })),
        }));

        return NextResponse.json(
            {
                rows: data,
                pagination: {
                    page,
                    pageSize,
                    total,
                    pageCount: Math.max(1, Math.ceil(total / pageSize)),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching feedback list:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feedback list' },
            { status: 500 }
        );
    }
}
