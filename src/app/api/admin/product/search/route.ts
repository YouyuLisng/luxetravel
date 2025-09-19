// app/api/admin/tour-products/search/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q) {
        return NextResponse.json({ rows: [] });
    }

    const rows = await db.tourProduct.findMany({
        where: {
            OR: [{ code: { contains: q } }, { name: { contains: q } }],
        },
        take: 20,
        select: { id: true, code: true, name: true },
    });

    return NextResponse.json({ rows });
}
