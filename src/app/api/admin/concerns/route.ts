import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ModuleType } from '@prisma/client';
// import getCurrentUser from '@/action/getCurrentUser';

export async function POST(request: Request) {
    // const currentUser = await getCurrentUser();
    // if (!currentUser) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

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
                status: true,
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
        const concerns = await db.travelConcern.findMany({
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({
            status: true,
            message: '成功取得所有 Concern',
            data: concerns,
        });
    } catch (error) {
        console.error('Error fetching all concerns:', error);
        return NextResponse.json(
            { error: 'Failed to fetch concerns' },
            { status: 500 }
        );
    }
}
