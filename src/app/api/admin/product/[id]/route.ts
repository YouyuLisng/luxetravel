import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ id: string }>;
}

// 將 Date 物件或 ISO 字串轉換成 YYYY-MM-DD
function formatDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // 取 "2025-09-29"
}

/** 取得單一 TourProduct（含 feedback） */
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
                    orderBy: {
                        day: 'asc',
                    },
                },
                feedback: true,
            },
        });

        if (!data) {
            return NextResponse.json(
                { status: false, message: '找不到產品' },
                { status: 404 }
            );
        }

        // 格式化所有日期欄位
        const formatted = {
            ...data,
            createdAt: formatDate(data.createdAt),
            updatedAt: formatDate(data.updatedAt),
            tour: data.tour.map((t) => ({
                ...t,
                departDate: formatDate(t.departDate),
                returnDate: formatDate(t.returnDate),
                createdAt: formatDate(t.createdAt),
                updatedAt: formatDate(t.updatedAt),
            })),
            itineraries: data.itineraries.map((i) => ({
                ...i,
                createdAt: formatDate(i.createdAt),
                updatedAt: formatDate(i.updatedAt),
            })),
            feedback: data.feedback
                ? {
                      id: data.feedback.id,
                      title: data.feedback.title,
                      nickname: data.feedback.nickname,
                      content: data.feedback.content,
                      imageUrl: data.feedback.imageUrl,
                      linkUrl: data.feedback.linkUrl,
                      createdAt: formatDate(data.feedback.createdAt),
                      updatedAt: formatDate(data.feedback.updatedAt),
                  }
                : null,
        };

        return NextResponse.json({ status: true, data: formatted });
    } catch (err) {
        console.error('error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}
