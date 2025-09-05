import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ id: string }>;
}

/** 取得單一 TourProduct */
export async function GET(_req: NextRequest, { params }: Props) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { status: false, message: '缺少 ID' },
                { status: 400 }
            );
        }

        const data = await db.tourProduct.findUnique({
            where: { id },
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
        });

        if (!data) {
            return NextResponse.json(
                { status: false, message: '找不到產品' },
                { status: 404 }
            );
        }

        return NextResponse.json({ status: true, data });
    } catch (err) {
        console.error('GET /tour-product/[id] error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}
