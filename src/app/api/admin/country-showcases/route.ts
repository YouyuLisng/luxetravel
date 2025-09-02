import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageUrl, title, subtitle, description, linkUrl, order } = body;

        if (!imageUrl || !title || !description) {
            return NextResponse.json(
                { error: '缺少必要欄位（imageUrl, title, description）' },
                { status: 400 }
            );
        }

        const item = await db.countryShowcase.create({
            data: {
                imageUrl,
                title,
                subtitle,
                description,
                linkUrl,
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
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.countryShowcase.count(),
            db.countryShowcase.findMany({
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
        console.error('Error fetching showcases:', error);
        return NextResponse.json(
            { error: 'Failed to fetch country showcases' },
            { status: 500 }
        );
    }
}
