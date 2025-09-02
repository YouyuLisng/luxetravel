// /app/api/feedback-country/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{ id: string }>;
}

// 取得單一 FeedbackCountry（含關聯的 Feedback 清單）
export async function GET(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const row = await db.feedbackCountry.findUnique({
            where: { id },
            include: {
                feedbacks: { include: { feedback: true } }, // join: FeedbackOnCountry -> feedback
            },
        });

        if (!row) {
            return NextResponse.json(
                { error: 'FeedbackCountry 不存在' },
                { status: 404 }
            );
        }

        const data = {
            id: row.id,
            name: row.name,
            nameZh: row.nameZh,
            code: row.code,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            feedbacks: row.feedbacks
                .filter((fc) => !!fc.feedback)
                .map((fc) => ({
                    id: fc.feedback.id,
                    title: fc.feedback.title,
                    subtitle: fc.feedback.subtitle,
                    content: fc.feedback.content,
                    nickname: fc.feedback.nickname,
                    imageUrl: fc.feedback.imageUrl,
                    linkUrl: fc.feedback.linkUrl,
                    linekName: fc.feedback.linekName,
                    order: fc.feedback.order,
                    createdAt: fc.feedback.createdAt,
                    updatedAt: fc.feedback.updatedAt,
                })),
        };

        return NextResponse.json(
            {
                status: true,
                message: `已取得 FeedbackCountry「${data.nameZh || data.name || data.id}」`,
                data,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch feedback country' },
            { status: 500 }
        );
    }
}

// 更新 FeedbackCountry
export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
    const nameZh =
        typeof body?.nameZh === 'string' ? body.nameZh.trim() : undefined;
    const code =
        typeof body?.code === 'string'
            ? body.code.trim().toUpperCase()
            : undefined;

    try {
        const updated = await db.feedbackCountry.update({
            where: { id },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(nameZh !== undefined ? { nameZh } : {}),
                ...(code !== undefined ? { code } : {}),
            },
        });

        return NextResponse.json({
            status: true,
            message: `FeedbackCountry「${updated.name} / ${updated.nameZh}」更新成功`,
            data: updated,
        });
    } catch (error: any) {
        console.error(error);
        if (error?.code === 'P2025') {
            return NextResponse.json(
                { error: 'FeedbackCountry 不存在' },
                { status: 404 }
            );
        }
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { error: '更新失敗：唯一鍵重複' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update feedback country' },
            { status: 500 }
        );
    }
}

// 刪除 FeedbackCountry（先清掉關聯，再刪自身）
export async function DELETE(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        // 先清除關聯（FeedbackOnCountry），避免殘留關聯記錄
        await db.feedbackOnCountry.deleteMany({ where: { countryId: id } });

        const deleted = await db.feedbackCountry.delete({ where: { id } });

        return NextResponse.json({
            status: true,
            message: `FeedbackCountry「${deleted.name} / ${deleted.nameZh}」已成功刪除`,
            data: deleted,
        });
    } catch (error: any) {
        console.error(error);
        if (error?.code === 'P2025') {
            return NextResponse.json(
                { error: 'FeedbackCountry 不存在或已刪除' },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to delete feedback country' },
            { status: 500 }
        );
    }
}
