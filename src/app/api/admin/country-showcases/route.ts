import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            imageUrl,
            imageUrl1,
            imageUrl2,
            title,
            subtitle,
            description,
            linkText,
            linkUrl,
            order,
        } = body;

        if (!imageUrl || !title) {
            return NextResponse.json(
                { error: '缺少必要欄位（imageUrl, title）' },
                { status: 400 }
            );
        }

        const item = await db.countryShowcase.create({
            data: {
                imageUrl,
                imageUrl1: imageUrl1 || null,
                imageUrl2: imageUrl2 || null,
                title,
                subtitle: subtitle || null,
                description: description || null,
                linkText: linkText || null,
                linkUrl: linkUrl || null,
                order: order ?? 0,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: `Country Showcase「${item.title}」建立成功`,
                data: item,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating country showcase:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // 👉 沒有帶分頁參數 → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.countryShowcase.findMany({
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    imageUrl: true,
                    imageUrl1: true,
                    imageUrl2: true,
                    title: true,
                    subtitle: true,
                    description: true,
                    linkText: true,
                    linkUrl: true,
                    order: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return NextResponse.json(
                {
                    status: true,
                    message: '成功取得全部 CountryShowcase 清單',
                    rows,
                    pagination: null, // 沒有分頁
                },
                { status: 200 }
            );
        }

        // 👉 有帶參數才做分頁
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.countryShowcase.count(),
            db.countryShowcase.findMany({
                orderBy: { order: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    imageUrl: true,
                    imageUrl1: true,
                    imageUrl2: true,
                    title: true,
                    subtitle: true,
                    description: true,
                    linkText: true,
                    linkUrl: true,
                    order: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        return NextResponse.json(
            {
                status: true,
                message: '成功取得 CountryShowcase 分頁清單',
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
        console.error('Error fetching showcases:', error);
        return NextResponse.json(
            { status: false, message: 'Failed to fetch country showcases' },
            { status: 500 }
        );
    }
}
