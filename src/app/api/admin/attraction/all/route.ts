// app/api/admin/attraction/all/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const rows = await db.attraction.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(
            {
                data: rows,
                pagination: {
                    page: 1,
                    pageSize: rows.length,
                    total: rows.length,
                    pageCount: 1,
                },
            },
            { status: 200 }
        );
    } catch (err) {
        console.error('Error fetching all attractions:', err);
        return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
    }
}
