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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mode, nickname, stars, content, linkUrl, order, imageUrl } =
            body; // ⬅️ 加入 imageUrl

        if (!mode || !content) {
            return NextResponse.json(
                { error: '缺少必要欄位（mode, content）' },
                { status: 400 }
            );
        }

        if (!Object.values(FeedbackMode).includes(mode as FeedbackMode)) {
            return NextResponse.json(
                { error: `無效的模式（mode: ${mode}）` },
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
                message: `Testimonial 建立成功`,
                data: { ...testimonial, color: getRandomColor() },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating testimonial:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode'); // e.g. "REAL" or "MARKETING"

        if (
            mode &&
            !Object.values(FeedbackMode).includes(mode as FeedbackMode)
        ) {
            return NextResponse.json(
                { error: `無效的 mode 參數：「${mode}」` },
                { status: 400 }
            );
        }

        const testimonials = await db.testimonial.findMany({
            where: mode ? { mode: mode as FeedbackMode } : undefined,
            orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        const testimonialsWithColor = testimonials.map((t) => ({
            ...t,
            color: getRandomColor(),
        }));

        return NextResponse.json({
            status: true,
            message: `成功取得${mode ? `「${mode}」` : '所有'}旅客回饋`,
            data: testimonialsWithColor,
        });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch testimonials' },
            { status: 500 }
        );
    }
}
