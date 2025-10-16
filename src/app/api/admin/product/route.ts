import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ProductType } from '@prisma/client'; // ✅ Prisma Enum

// ✅ 將 {{文字}} 包成有背景樣式的 <span>
function formatRichText(content?: string | null): string | null {
    if (!content) return null;

    let html = content.replace(/\{\{(.*?)\}\}/g, (_match, p1) => {
        const inner = p1.trim();
        return `<span style="background-color:#f5deb3;color:#000;padding:0 2px;border-radius:2px;">${inner}</span>`;
    });

    // ✅ 換行符號改成 <br/>
    html = html.replace(/\r?\n/g, '<br/>');

    return html;
}

// ✅ 將 hotel 欄位換成 HTML 可顯示格式
function formatHotel(hotel?: string | null): string | null {
    if (!hotel) return null;
    const parts = hotel.split(' 或 ');
    if (parts.length === 1) return hotel;
    return parts.join('<br/> 或 ');
}

/**
 * ✅ 取得所有 TourProduct (支援分頁 + 類型過濾)
 * GET /api/admin/tour-product?page=1&pageSize=10&type=GROUP
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
        const type = searchParams.get('type') ?? null;

        const skip = (page - 1) * pageSize;
        const take = pageSize;

        // ✅ 若有指定 type，轉成 Prisma Enum
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
                    orderBy: { day: 'asc' },
                },
            },
            orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        });

        // ✅ 格式化每筆資料
        const formatted = data.map((p) => ({
            ...p,
            summary: formatRichText(p.summary),
            description: formatRichText(p.description),
            reminder: formatRichText(p.reminder),
            policy: formatRichText(p.policy),
            memo: formatRichText(p.memo),
            itineraries: p.itineraries.map((i) => ({
                ...i,
                hotel: formatHotel(i.hotel),
            })),
        }));

        return NextResponse.json({
            rows: formatted,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize),
            },
        });
    } catch (err) {
        console.error('GET /api/admin/tour-product error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}
