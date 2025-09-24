import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/pages?page=&pageSize=&q=
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');
        const q = searchParams.get('q')?.trim();

        const where: Prisma.PageWhereInput = q
            ? {
                  OR: [{ title: { contains: q, mode: 'insensitive' } }],
              }
            : {};

        // 👉 沒帶 page/pageSize → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.page.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }],
                include: {
                    tourProducts: {
                        include: { tourProduct: true },
                    },
                },
            });

            const result = rows.map((p) => ({
                ...p,
                tourProducts: p.tourProducts.map((tp) => tp.tourProduct),
            }));

            return NextResponse.json(
                {
                    status: true,
                    message: '成功取得全部 Page 清單',
                    rows: result,
                    pagination: null, // 沒有分頁
                },
                { status: 200 }
            );
        }

        // 👉 有分頁參數才分頁
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.page.count({ where }),
            db.page.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    tourProducts: {
                        include: { tourProduct: true },
                    },
                },
            }),
        ]);

        const result = rows.map((p) => ({
            ...p,
            tourProducts: p.tourProducts.map((tp) => tp.tourProduct),
        }));

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 Page 分頁清單',
                rows: result,
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
            {
                status: false,
                message: '取得 Page 列表失敗',
            },
            { status: 500 }
        );
    }
}
