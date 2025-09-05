import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/** GET /api/admin/tour-product - 取得所有 TourProduct */
export async function GET() {
    try {
        const data = await db.tourProduct.findMany({
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

        return NextResponse.json({ status: true, data });
    } catch (err) {
        console.error('GET /tour-product error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}
