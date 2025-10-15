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

        const mod = await db.module.findUnique({ where: { id: moduleId } });
        if (!mod) {
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
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // ➤ 如果 page 和 pageSize 都沒帶，就回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.travelAdvantage.findMany({
                orderBy: { order: 'asc' },
            });
            return NextResponse.json({
                status: true,
                message: '成功取得全部 Advantage 清單',
                rows,
                pagination: null, // 沒有分頁
            });
        }

        // ➤ 否則照分頁處理
        const page = Math.max(1, parseInt(pageParam ?? '1', 10));
        const pageSize = Math.max(1, parseInt(pageSizeParam ?? '10', 10));
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
            message: '成功取得 Advantage 分頁清單',
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
