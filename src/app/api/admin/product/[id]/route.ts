import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ id: string }>;
}

// ✅ 將 Date 物件或 ISO 字串轉換成 YYYY-MM-DD
function formatDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// ✅ 將 hotel 欄位換成 HTML 可顯示格式
function formatHotel(hotel?: string | null): string | null {
    if (!hotel) return null;
    const parts = hotel.split(' 或 ');
    if (parts.length === 1) return hotel;
    return parts.join('<br/> 或 ');
}

// ✅ 將文字轉為 HTML 格式（支援 {{}} 樣式與換行）
function formatRichText(content?: string | null): string | null {
    if (!content) return null;

    // 1️⃣ 將 {{文字}} 轉成高亮 span
    let html = content.replace(/\{\{(.*?)\}\}/g, (_match, p1) => {
        const inner = p1.trim();
        return `<span style="background-color:#f5deb3;color:#000;padding:0 2px;border-radius:2px;">${inner}</span>`;
    });

    // 2️⃣ 換行符號改成 <br/>
    html = html.replace(/\r?\n/g, '<br/>');

    return html;
}

/** ✅ 取得單一 TourProduct（含 feedback） */
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
                            include: { attraction: true },
                        },
                    },
                    orderBy: { day: 'asc' },
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

        // ✅ 格式化欄位
        const formatted = {
            ...data,

            // ✅ 特殊欄位轉為 HTML 格式
            summary: formatRichText(data.summary),
            description: formatRichText(data.description),
            reminder: formatRichText(data.reminder),
            policy: formatRichText(data.policy),
            memo: formatRichText(data.memo), // ✅ 新增：注意(列表頁中的備註)

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
                hotel: formatHotel(i.hotel),
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
