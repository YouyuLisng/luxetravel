// src/app/api/admin/feedback/[id]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';

interface Props {
    params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        // Feedback + 關聯的產品（多筆）
        const row = await db.feedback.findUnique({
            where: { id },
            include: {
                products: true, // ✅ 改成 products
            },
        });

        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到指定的 Feedback' },
                { status: 404 }
            );
        }

        const data = {
            id: row.id,
            title: row.title,
            content: row.content ?? null,
            nickname: row.nickname,
            imageUrl: row.imageUrl,
            linkUrl: row.linkUrl,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            products: row.products.map((p) => ({
                id: p.id,
                code: p.code,
                name: p.name,
            })),
        };

        return NextResponse.json({
            status: true,
            message: `已取得 Feedback「${data.title || data.id}」`,
            data,
        });
    } catch (error) {
        console.error('Failed to get feedback:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feedback' },
            { status: 500 }
        );
    }
}
