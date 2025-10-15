import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ productId: string }>;
}

/** ✅ 將 hotel 欄位換成 HTML 可顯示格式 */
function formatHotel(hotel?: string | null): string | null {
    if (!hotel) return null;
    const parts = hotel.split(' 或 ');
    if (parts.length === 1) return hotel;
    return parts.join('<br/> 或 ');
}

/** ✅ GET /api/itinerary/[productId]/attractions - 取得某產品的所有每日行程與景點 */
export async function GET(_req: Request, { params }: Props) {
    try {
        const { productId } = await params;
        if (!productId) {
            return NextResponse.json(
                { status: false, message: '缺少 productId' },
                { status: 400 }
            );
        }

        // ✅ 查詢每日行程（含景點與飯店欄位）
        const data = await db.itinerary.findMany({
            where: { productId },
            orderBy: { day: 'asc' },
            select: {
                day: true,
                hotel: true, // ✅ 取出飯店欄位
                attractions: {
                    include: {
                        attraction: true,
                    },
                },
            },
        });

        if (!data || data.length === 0) {
            return NextResponse.json(
                { status: false, message: '找不到每日行程景點' },
                { status: 404 }
            );
        }

        // ✅ 格式化飯店欄位
        const formatted = data.map((i) => ({
            ...i,
            hotel: formatHotel(i.hotel),
        }));

        return NextResponse.json({ status: true, data: formatted });
    } catch (err: any) {
        console.error('取得每日行程景點失敗:', err);
        return NextResponse.json(
            { status: false, message: err?.message ?? '伺服器錯誤' },
            { status: 500 }
        );
    }
}
