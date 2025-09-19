import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/pages?page=&pageSize=&q=
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );
        const q = searchParams.get('q')?.trim();

        const where: Prisma.PageWhereInput = q
            ? {
                  OR: [
                      { title: { contains: q, mode: 'insensitive' } },
                  ],
              }
            : {};

        const [total, rows] = await Promise.all([
            db.page.count({ where }),
            db.page.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return NextResponse.json(
            {
                rows,
                pagination: {
                    page,
                    pageSize,
                    total,
                    pageCount: Math.max(1, Math.ceil(total / pageSize)),
                },
            },
            { status: 200 }
        );
    } catch (e) {
        console.error('GET /pages error:', e);
        return NextResponse.json(
            { error: '取得 Page 列表失敗' },
            { status: 500 }
        );
    }
}
