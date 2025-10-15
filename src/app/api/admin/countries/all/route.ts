import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const data = await db.country.findMany({
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
        data,
        pagination: {
            page: 1,
            pageSize: data.length,
            total: data.length,
            pageCount: 1,
        },
    });
}
