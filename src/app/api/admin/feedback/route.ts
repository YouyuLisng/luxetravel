import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // 👉 沒帶 page/pageSize → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.feedback.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    product: true,
                },
            });

            const data = rows.map((f) => ({
                id: f.id,
                title: f.title,
                content: f.content,
                nickname: f.nickname,
                imageUrl: f.imageUrl,
                linkUrl: f.linkUrl,
                createdAt: f.createdAt,
                updatedAt: f.updatedAt,
                product: f.product
                    ? {
                          id: f.product.id,
                          code: f.product.code,
                          name: f.product.name,
                      }
                    : null,
            }));

            return NextResponse.json(
                {
                    status: true,
                    message: '成功取得全部 Feedback 清單',
                    rows: data,
                    pagination: null, // 沒有分頁
                },
                { status: 200 }
            );
        }

        // 👉 有分頁參數才執行分頁
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.feedback.count(),
            db.feedback.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    product: true,
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const data = rows.map((f) => ({
            id: f.id,
            title: f.title,
            content: f.content,
            nickname: f.nickname,
            imageUrl: f.imageUrl,
            linkUrl: f.linkUrl,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
            product: f.product
                ? {
                      id: f.product.id,
                      code: f.product.code,
                      name: f.product.name,
                  }
                : null,
        }));

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 Feedback 分頁清單',
                rows: data,
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
        console.error('Error fetching feedback list:', error);
        return NextResponse.json(
            { status: false, message: 'Failed to fetch feedback list' },
            { status: 500 }
        );
    }
}
