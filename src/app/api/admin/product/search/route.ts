import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    try {
        const where = q
            ? {
                  OR: [{ code: { contains: q } }, { name: { contains: q } }],
              }
            : undefined;

        const rows = await db.tourProduct.findMany({
            where,
            select: {
                id: true,
                code: true,
                name: true,
                arriveCountry: true,
                days: true,
                nights: true,
                category: true,
                priceMin: true,
                priceMax: true,
                status: true,
                isFeatured: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return NextResponse.json({ rows });
    } catch (err: any) {
        console.error('search tourProducts error:', err);
        return NextResponse.json(
            { error: '查詢失敗', rows: [] },
            { status: 500 }
        );
    }
}
