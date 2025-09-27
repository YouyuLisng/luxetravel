import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ productId: string }>;
}

/** GET /api/itinerary/[productId] - 取得某產品的所有每日行程 */
export async function GET(_req: Request, { params }: Props) {
    try {
        const { productId } = await params;
        if (!productId) {
            return NextResponse.json(
                { status: false, message: '缺少 productId' },
                { status: 400 }
            );
        }

        const data = await db.itinerary.findMany({
            where: { productId },
            orderBy: { day: 'asc' },
            include: {
                routes: true,
                attractions: {
                    include: {
                        attraction: true,
                    },
                },
            },
        });

        if (!data || data.length === 0) {
            return NextResponse.json(
                { status: false, message: '找不到每日行程' },
                { status: 404 }
            );
        }

        return NextResponse.json({ status: true, data });
    } catch (err: any) {
        console.error('取得每日行程失敗:', err);
        return NextResponse.json(
            { status: false, message: err?.message ?? '伺服器錯誤' },
            { status: 500 }
        );
    }
}
