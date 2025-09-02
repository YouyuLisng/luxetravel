import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FeedbackMode } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { mode, nickname, stars, content, linkUrl, order } = body; // 加入 order

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
                order: typeof order === 'number' ? order : 0, // 預設 0
            },
        });

        return NextResponse.json(
            {
                status: true,
                message: `Testimonial 建立成功`,
                data: testimonial,
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
            orderBy: [
                { order: 'asc' },      
                { createdAt: 'desc' } 
            ],
        });

        return NextResponse.json({
            status: true,
            message: `成功取得${mode ? `「${mode}」` : '所有'}旅客回饋`,
            data: testimonials,
        });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch testimonials' },
            { status: 500 }
        );
    }
}
