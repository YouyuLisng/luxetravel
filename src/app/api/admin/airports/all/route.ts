// app/api/admin/airports/all/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const rows = await db.airport.findMany({
            include: { region: true, country: true },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            data: rows,
            pagination: {
                page: 1,
                pageSize: rows.length,
                total: rows.length,
                pageCount: 1,
            },
        });
    } catch (err) {
        return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
    }
}
