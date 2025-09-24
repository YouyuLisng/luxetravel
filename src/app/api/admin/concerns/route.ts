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
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // 👉 如果沒帶分頁參數 → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.travelConcern.findMany({
                orderBy: { order: 'asc' },
            });

            return NextResponse.json(
                {
                    status: true,
                    message: '成功取得全部 Concern 清單',
                    rows,
                    pagination: null, // 沒有分頁
                },
                { status: 200 }
            );
        }

        // 👉 有帶分頁參數 → 分頁查詢
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 10))
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
                status: true,
                message: '成功取得 Concern 分頁清單',
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
            { status: false, message: 'Failed to fetch concerns' },
            { status: 500 }
        );
    }
}
