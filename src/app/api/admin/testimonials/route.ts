import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FeedbackMode } from '@prisma/client';

// 🎨 背景色 + 文字色
const COLOR_PAIRS = [
    { bg: '#F87171', text: '#B91C1C' }, // 柔紅 → 深紅
    { bg: '#FBBF24', text: '#B45309' }, // 柔黃 → 深橙
    { bg: '#34D399', text: '#065F46' }, // 薄荷綠 → 深墨綠
    { bg: '#60A5FA', text: '#1D4ED8' }, // 淡藍 → 深藍
    { bg: '#A78BFA', text: '#6D28D9' }, // 淡紫 → 深紫
    { bg: '#F472B6', text: '#BE185D' }, // 粉紅 → 深玫紅
    { bg: '#F59E0B', text: '#B45309' }, // 金橙 → 深橙（與柔黃共用）
    { bg: '#10B981', text: '#065F46' }, // 青綠 → 深墨綠（與薄荷綠共用）
];

function getRandomColorPair() {
    return COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)];
}

// === 建立 Testimonial ===
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mode, nickname, stars, content, linkUrl, order, imageUrl } = body;

        if (!mode || !content) {
            return NextResponse.json(
                { status: false, error: '缺少必要欄位（mode, content）' },
                { status: 400 }
            );
        }

        if (!Object.values(FeedbackMode).includes(mode as FeedbackMode)) {
            return NextResponse.json(
                { status: false, error: `無效的模式（mode: ${mode}）` },
                { status: 400 }
            );
        }

        const testimonial = await db.testimonial.create({
            data: {
                mode: mode as FeedbackMode,
                nickname,
                stars,
                content,
                linkUrl,
                imageUrl: imageUrl ?? null,
                order: typeof order === 'number' ? order : 0,
            },
        });

        const colorPair = getRandomColorPair();

        return NextResponse.json(
            {
                status: true,
                message: 'Testimonial 建立成功',
                data: { ...testimonial, color: colorPair },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating testimonial:', error);
        return NextResponse.json(
            { status: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// === 查詢 Testimonial ===
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode');
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        if (mode && !Object.values(FeedbackMode).includes(mode as FeedbackMode)) {
            return NextResponse.json(
                { status: false, error: `無效的 mode 參數：「${mode}」` },
                { status: 400 }
            );
        }

        const where = mode ? { mode: mode as FeedbackMode } : {};

        // ✅ 若沒分頁 → 全部資料
        if (!pageParam && !pageSizeParam) {
            const rows = await db.testimonial.findMany({
                where,
                orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            });

            const testimonialsWithColors = rows.map((t, i) => ({
                ...t,
                color: COLOR_PAIRS[i % COLOR_PAIRS.length], // 循環配色
            }));

            return NextResponse.json(
                {
                    status: true,
                    message: `成功取得${mode ? `「${mode}」` : '所有'}旅客回饋（全部資料）`,
                    rows: testimonialsWithColors,
                    pagination: null,
                },
                { status: 200 }
            );
        }

        // ✅ 分頁模式
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(1, Number(pageSizeParam ?? 10));

        const total = await db.testimonial.count({ where });
        const pageCount = Math.max(1, Math.ceil(total / pageSize));

        const rows = await db.testimonial.findMany({
            where,
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        const testimonialsWithColors = rows.map((t, i) => ({
            ...t,
            color: COLOR_PAIRS[i % COLOR_PAIRS.length],
        }));

        return NextResponse.json(
            {
                status: true,
                message: `成功取得${mode ? `「${mode}」` : '所有'}旅客回饋（分頁）`,
                rows: testimonialsWithColors,
                pagination: { page, pageSize, total, pageCount },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json(
            { status: false, error: 'Failed to fetch testimonials' },
            { status: 500 }
        );
    }
}
