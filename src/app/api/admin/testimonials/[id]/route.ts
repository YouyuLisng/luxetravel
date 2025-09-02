import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FeedbackMode } from '@prisma/client';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(_request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const row = await db.testimonial.findUnique({ where: { id } });

        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到指定的 Testimonial' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: `已取得 Testimonial「${row.nickname || row.id}」`,
            data: row,
        });
    } catch (error) {
        console.error('Error fetching testimonial:', error);
        return NextResponse.json(
            { error: 'Failed to fetch testimonial' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { mode, nickname, stars, content, linkUrl, order } = body; // ← 加入 order

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

    try {
        const updatedTestimonial = await db.testimonial.update({
            where: { id },
            data: {
                mode: mode as FeedbackMode,
                nickname,
                stars,
                content,
                linkUrl,
                order: typeof order === 'number' ? order : undefined, // ← 只有有帶數字才更新
            },
        });

        return NextResponse.json({
            status: true,
            message: `Testimonial「${updatedTestimonial.nickname || updatedTestimonial.id}」更新成功`,
            data: updatedTestimonial,
        });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        return NextResponse.json(
            { error: 'Failed to update testimonial' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const deletedTestimonial = await db.testimonial.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: `Testimonial「${deletedTestimonial.nickname || deletedTestimonial.id}」已成功刪除`,
            data: deletedTestimonial,
        });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        return NextResponse.json(
            { error: 'Failed to delete testimonial' },
            { status: 500 }
        );
    }
}
