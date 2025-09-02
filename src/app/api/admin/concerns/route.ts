import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { moduleId, number, content, order } = body;

        if (!moduleId || !number || !content || order === undefined) {
            return NextResponse.json(
                {
                    error: 'Missing required fields (moduleId, number, content, order)',
                },
                { status: 400 }
            );
        }

        // 檢查 module 是否存在
        const advantages = await db.module.findUnique({
            where: { id: moduleId },
        });
        if (!advantages) {
            return NextResponse.json(
                { error: `找不到對應的 Module（id: ${moduleId}）` },
                { status: 404 }
            );
        }

        const concern = await db.travelConcern.create({
            data: {
                moduleId,
                number,
                content,
                order,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: `Concern「${concern.number}」建立成功`,
                data: concern,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating concern:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.travelConcern.count(),
            db.travelConcern.findMany({
                orderBy: { order: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return NextResponse.json(
            {
                rows,
                pagination: {
                    page,
                    pageSize,
                    total,
                    pageCount: Math.max(1, Math.ceil(total / pageSize)),
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching concerns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch concerns' },
            { status: 500 }
        );
    }
}
