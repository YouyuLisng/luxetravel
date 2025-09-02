import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ModuleType } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { moduleId, imageUrl, title, content, order } = body;

        if (!moduleId || !imageUrl || !title || !content || !order) {
            return NextResponse.json(
                {
                    error: 'Missing required fields (moduleId, imageUrl, title, content)',
                },
                { status: 400 }
            );
        }

        const advantages = await db.module.findUnique({ where: { id: moduleId } });
        if (!advantages) {
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
                order
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

export async function GET() {
    try {
        const advantages = await db.travelAdvantage.findMany({
            orderBy: { order: 'asc' },
        });


        return NextResponse.json({
            status: true,
            message: `成功取得 Advantage 模組與清單`,
            data: advantages,
        });
    } catch (error) {
        console.error('Error fetching advantages:', error);
        return NextResponse.json(
            { error: 'Failed to fetch advantages' },
            { status: 500 }
        );
    }
}
