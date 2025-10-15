import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ id: string }>; // 這裡的 id 是 Tours.id
}

// 將日期轉成 YYYY-MM-DD
function formatDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

/** GET /api/tour/[id] - 取得單一梯次 (包含產品完整關聯) */
export async function GET(_req: Request, { params }: Props) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { status: false, message: '缺少梯次 ID' },
                { status: 400 }
            );
        }

        const tour = await db.tours.findUnique({
            where: { id },
            include: {
                product: {
                    include: {
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
                },
            },
        });

        if (!tour) {
            return NextResponse.json(
                { status: false, message: '找不到梯次' },
                { status: 404 }
            );
        }

        // 格式化日期
        const formatted = {
            ...tour,
            departDate: formatDate(tour.departDate),
            returnDate: formatDate(tour.returnDate),
            createdAt: formatDate(tour.createdAt),
            updatedAt: formatDate(tour.updatedAt),
            product: {
                ...tour.product,
                createdAt: formatDate(tour.product.createdAt),
                updatedAt: formatDate(tour.product.updatedAt),
                itineraries: tour.product.itineraries.map((i) => ({
                    ...i,
                    createdAt: formatDate(i.createdAt),
                    updatedAt: formatDate(i.updatedAt),
                })),
            },
        };

        return NextResponse.json({ status: true, data: formatted });
    } catch (err: any) {
        console.error('GET /api/tour/[id] error:', err);
        return NextResponse.json(
            { status: false, message: err?.message ?? '伺服器錯誤' },
            { status: 500 }
        );
    }
}
