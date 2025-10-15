import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { FeedbackMode } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { deleteFromVercelBlob } from '@/lib/vercel-blob';

interface Props {
    params: Promise<{ id: string }>;
}

// 🎨 背景色 + 文字色（移除 desc）
const COLOR_PAIRS = [
    { bg: '#F87171', text: '#B91C1C' },
    { bg: '#FBBF24', text: '#B45309' },
    { bg: '#34D399', text: '#065F46' },
    { bg: '#60A5FA', text: '#1D4ED8' },
    { bg: '#A78BFA', text: '#6D28D9' },
    { bg: '#F472B6', text: '#BE185D' },
    { bg: '#F59E0B', text: '#B45309' },
    { bg: '#10B981', text: '#065F46' },
];

function getRandomColorPair() {
    return COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)];
}

/* ------------------------- 取得單筆 ------------------------- */
export async function GET(_request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const row = await db.testimonial.findUnique({ where: { id } });

        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到指定的旅客回饋' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: `已取得旅客回饋「${row.nickname || row.id}」`,
            data: {
                ...row,
                color: getRandomColorPair(),
            },
        });
    } catch (error) {
        console.error('Error fetching testimonial:', error);
        return NextResponse.json(
            { error: 'Failed to fetch testimonial' },
            { status: 500 }
        );
    }
}

/* ------------------------- 更新 ------------------------- */
export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { mode, nickname, stars, content, linkUrl, order, imageUrl } = body;

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
        const exists = await db.testimonial.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { error: '找不到 Testimonial' },
                { status: 404 }
            );
        }

        // 若有更新圖片 → 刪除舊圖
        if (imageUrl && exists.imageUrl && imageUrl !== exists.imageUrl) {
            try {
                await deleteFromVercelBlob(exists.imageUrl);
            } catch (err) {
                console.warn('刪除舊圖片失敗:', exists.imageUrl, err);
            }
        }

        const updatedTestimonial = await db.testimonial.update({
            where: { id },
            data: {
                mode: mode as FeedbackMode,
                nickname: nickname?.trim() || null,
                stars: stars ?? null,
                content,
                linkUrl: linkUrl?.trim() || null,
                order: typeof order === 'number' ? order : 0,
                imageUrl: imageUrl?.trim() || null,
            },
        });

        return NextResponse.json({
            status: true,
            message: `旅客回饋「${
                updatedTestimonial.nickname || updatedTestimonial.id
            }」更新成功`,
            data: {
                ...updatedTestimonial,
                color: getRandomColorPair(),
            },
        });
    } catch (error) {
        console.error('Error updating testimonial:', error);
        return NextResponse.json(
            { error: 'Failed to update testimonial' },
            { status: 500 }
        );
    }
}

/* ------------------------- 刪除 ------------------------- */
export async function DELETE(_request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const exists = await db.testimonial.findUnique({ where: { id } });
        if (!exists) {
            return NextResponse.json(
                { error: '找不到旅客回饋' },
                { status: 404 }
            );
        }

        if (exists.imageUrl) {
            try {
                await deleteFromVercelBlob(exists.imageUrl);
            } catch (err) {
                console.warn('刪除圖片失敗:', exists.imageUrl, err);
            }
        }

        const deletedTestimonial = await db.testimonial.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: `Testimonial「${
                deletedTestimonial.nickname || deletedTestimonial.id
            }」已成功刪除`,
            data: {
                ...deletedTestimonial,
                color: getRandomColorPair(),
            },
        });
    } catch (error) {
        console.error('Error deleting testimonial:', error);
        return NextResponse.json(
            { error: 'Failed to delete testimonial' },
            { status: 500 }
        );
    }
}
