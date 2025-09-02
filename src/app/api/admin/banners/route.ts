import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import getCurrentUser from '@/action/getCurrentUser';

export async function POST(request: Request) {
    // const currentUser = await getCurrentUser();
    // if (!currentUser) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    try {
        const body = await request.json();
        const { imageUrl, title, subtitle, linkText, linkUrl, order } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Missing imageUrl' },
                { status: 400 }
            );
        }

        if (!title) {
            return NextResponse.json(
                { error: 'Missing title' },
                { status: 400 }
            );
        }

        const banner = await db.banner.create({
            data: {
                imageUrl,
                title,
                subtitle,
                linkText,
                linkUrl,
                order: typeof order === 'number' ? order : 0,
            },
        });

        return NextResponse.json(
            {
                status: true,
                message: `Banner「${banner.title || banner.id}」建立成功`,
                data: banner,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating banner:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const banners = await db.banner.findMany({
            orderBy: { order: "asc" }, 
        });
        return NextResponse.json(
            {
                status: true,
                message: '成功取得所有 Banners',
                data: banners,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch banners' },
            { status: 500 }
        );
    }
}
