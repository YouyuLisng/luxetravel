// src/app/api/admin/feedback-country/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    // const currentUser = await getCurrentUser();
    // if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const name = String(body?.name || '').trim();
        const nameZh = String(body?.nameZh || '').trim();
        const code = String(body?.code || '')
            .trim()
            .toUpperCase();

        if (!name)
            return NextResponse.json(
                { error: 'Missing name' },
                { status: 400 }
            );
        if (!nameZh)
            return NextResponse.json(
                { error: 'Missing nameZh' },
                { status: 400 }
            );
        if (!code)
            return NextResponse.json(
                { error: 'Missing code' },
                { status: 400 }
            );

        // name 在 FeedbackCountry 為 unique
        const dup = await db.feedbackCountry.findUnique({ where: { name } });
        if (dup) {
            return NextResponse.json(
                { error: `FeedbackCountry 已存在（name 重複: ${name}）` },
                { status: 409 }
            );
        }

        const country = await db.feedbackCountry.create({
            data: { name, nameZh, code },
        });

        return NextResponse.json(
            {
                status: true,
                message: `FeedbackCountry「${country.name} / ${country.nameZh}」建立成功`,
                data: country,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating feedback country:', error);
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { error: 'FeedbackCountry 已存在（unique 衝突）' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const rows = await db.feedbackCountry.findMany({
            orderBy: { name: 'asc' },
            include: {
                feedbacks: { include: { feedback: true } }, // 連同關聯的回饋
            },
        });

        const countries = rows.map((row) => ({
            id: row.id,
            name: row.name,
            nameZh: row.nameZh,
            code: row.code,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            // 扁平化回傳關聯的 Feedback（可給前端需要時使用）
            feedbacks: row.feedbacks.map((fc) => ({
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
        }));

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 Feedback Countries',
                data: countries,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching feedback countries:', error);
        return NextResponse.json(
            { error: 'Failed to fetch feedback countries' },
            { status: 500 }
        );
    }
}
