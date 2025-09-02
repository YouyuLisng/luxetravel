import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { moduleId, imageUrl, title, content, order } = body;

        if (!moduleId || !imageUrl || !title || !content || !order) {
            return NextResponse.json(
                {
                    error: 'Missing required fields (moduleId, imageUrl, title, content, order)',
                },
                { status: 400 }
            );
        }

        const module = await db.module.findUnique({ where: { id: moduleId } });
        if (!module) {
            return NextResponse.json(
                { error: '找不到對應的 Module' },
                { status: 404 }
            );
        }

        const advantage = await db.travelAdvantage.create({
            data: {
                moduleId,
                imageUrl,
                title,
                content,
                order,
            },
        });

        return NextResponse.json(
            {
                status: true,
                message: `Advantage「${advantage.title}」建立成功`,
                data: advantage,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating advantage:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') ?? '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);

        const skip = (page - 1) * pageSize;

        const [advantages, total] = await Promise.all([
            db.travelAdvantage.findMany({
                skip,
                take: pageSize,
                orderBy: { order: 'asc' },
            }),
            db.travelAdvantage.count(),
        ]);

        return NextResponse.json({
            status: true,
            message: '成功取得 Advantage 模組與清單',
            rows: advantages,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error('Error fetching advantages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch advantages' },
            { status: 500 }
        );
    }
}
