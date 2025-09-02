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
                status: true,
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

export async function GET() {
    try {
        const showcases = await db.countryShowcase.findMany({
            orderBy: { order: 'asc' },
        });

        return NextResponse.json({
            status: true,
            message: '成功取得所有 Country Showcase',
            data: showcases,
        });
    } catch (error) {
        console.error('Error fetching showcases:', error);
        return NextResponse.json(
            { error: 'Failed to fetch country showcases' },
            { status: 500 }
        );
    }
}
