import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/pages/[id]
 */
export async function GET(_req: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const row = await db.page.findUnique({
            where: { 
                slug: id
            },
            include: {
                tourProducts: {
                    include: { tourProduct: true },
                },
            },
        });

        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到 Page' },
                { status: 404 }
            );
        }

        return NextResponse.json({ status: true, data: row });
    } catch (e) {
        console.error('GET /pages/[id] error:', e);
        return NextResponse.json({ error: '查詢失敗' }, { status: 500 });
    }
}
