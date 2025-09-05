import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/admin/tour-product?page=1&pageSize=10 - 取得所有 TourProduct (支援分頁) */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // 取得 query string
        const page = parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);

        // 分頁計算
        const skip = (page - 1) * pageSize;
        const take = pageSize;

        // 總數
        const total = await db.tourProduct.count();

        // 查詢資料
        const data = await db.tourProduct.findMany({
            skip,
            take,
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
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            rows: data,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize), // 👈 改這裡
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
