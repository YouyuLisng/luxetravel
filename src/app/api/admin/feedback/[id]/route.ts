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
        // Feedback + 關聯表 + 國家
        const row = await db.feedback.findUnique({
            where: { id },
            include: {
                countries: {
                    include: { country: true },
                },
            },
        });

        if (!row) {
            return NextResponse.json(
                { status: false, message: '找不到指定的 Feedback' },
                { status: 404 }
            );
        }

        // 扁平化成「countries: FeedbackCountry[]」
        const data = {
            id: row.id,
            title: row.title,
            subtitle: row.subtitle ?? null,
            content: row.content ?? null,
            nickname: row.nickname,
            imageUrl: row.imageUrl,
            linkUrl: row.linkUrl,
            linekName: row.linekName ?? null, // 依你的欄位名
            order: row.order,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            countries: row.countries.map((rel) => ({
                id: rel.country.id,
                name: rel.country.name,
                nameZh: rel.country.nameZh,
                code: rel.country.code,
                createdAt: rel.country.createdAt,
                updatedAt: rel.country.updatedAt,
            })),
        };

        return NextResponse.json({
            status: true,
            message: `已取得 Feedback「${data.title || data.id}」`,
            data,
        });
    } catch (error) {
        console.error('Failed to get feedback with countries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feedback' },
            { status: 500 }
        );
    }
}
