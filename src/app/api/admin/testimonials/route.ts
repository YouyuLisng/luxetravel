import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FeedbackMode } from '@prisma/client';

const COLORS = [
    '#F87171',
    '#FBBF24',
    '#34D399',
    '#60A5FA',
    '#A78BFA',
    '#F472B6',
    '#F59E0B',
    '#10B981',
];

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// 建立 Testimonial
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

        return NextResponse.json(
            {
                status: true,
                message: 'Testimonial 建立成功',
                data: { ...testimonial, color: getRandomColor() },
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

// 查詢 Testimonial
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

        // 👉 如果沒傳 page / pageSize → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.testimonial.findMany({
                where,
                orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
            });

            const testimonialsWithColor = rows.map((t) => ({
                ...t,
                color: getRandomColor(),
            }));

            return NextResponse.json(
                {
                    status: true,
                    message: `成功取得${mode ? `「${mode}」` : '所有'}旅客回饋（全部資料）`,
                    rows: testimonialsWithColor,
                    pagination: null,
                },
                { status: 200 }
            );
        }

        // 👉 有分頁參數 → 回傳分頁資料
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

        const testimonialsWithColor = rows.map((t) => ({
            ...t,
            color: getRandomColor(),
        }));

        return NextResponse.json(
            {
                status: true,
                message: `成功取得${mode ? `「${mode}」` : '所有'}旅客回饋（分頁）`,
                rows: testimonialsWithColor,
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
