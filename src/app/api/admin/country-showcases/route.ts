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
