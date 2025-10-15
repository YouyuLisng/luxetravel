import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProductType } from '@prisma/client'; // ✅ Prisma Enum

/**
 * GET /api/admin/tour-product?page=1&pageSize=10&type=GROUP
 * 取得所有 TourProduct (支援分頁 + 類型過濾)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
        const type = searchParams.get('type') ?? null;

        const skip = (page - 1) * pageSize;
        const take = pageSize;

        // ✅ 轉型成 Prisma Enum
        const where = type ? { category: type as ProductType } : {};

        const total = await db.tourProduct.count({ where });

        const data = await db.tourProduct.findMany({
            skip,
            take,
            where,
            include: {
                tour: true,
                flights: true,
                map: true,
                highlights: true,
                itineraries: {
                    include: {
                        routes: true,
                        attractions: {
                            include: {
                                attraction: true,
                            },
                        },
                    },
                    orderBy: {
                        day: 'asc',
                    },
                },
            },
            orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        });

        return NextResponse.json({
            rows: data,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize),
            },
        });
    } catch (err) {
        console.error('GET /tour-product error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}
