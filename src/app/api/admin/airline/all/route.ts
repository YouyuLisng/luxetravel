import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const rows = await db.airline.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
        rows,
        pagination: {
            page: 1,
            pageSize: rows.length,
            total: rows.length,
            pageCount: 1,
        },
    });
}
