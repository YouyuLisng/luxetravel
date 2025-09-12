import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import getCurrentUser from '@/action/getCurrentUser';

// POST /api/admin/banner
export async function POST(request: Request) {
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
                success: true,
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

function formatTitle(title: string) {
    const chars = Array.from(title);
    return [chars.slice(0, 5).join(''), chars.slice(5).join('')];
}

function formatSubtitle(subtitle: string) {
    const chars = Array.from(subtitle);
    return [chars.slice(0, 12).join(''), chars.slice(12).join('')];
}

// GET /api/admin/banner?page=&pageSize=
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );

        const [total, rows] = await Promise.all([
            db.banner.count(),
            db.banner.findMany({
                orderBy: { order: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const formattedRows = rows.map((banner) => {
            const [titleLine1, titleLine2] = formatTitle(banner.title);
            const [subtitleLine1, subtitleLine2] = banner.subtitle
                ? formatSubtitle(banner.subtitle)
                : ['', ''];

            return {
                ...banner,
                titleLine1,
                titleLine2,
                subtitleLine1,
                subtitleLine2,
            };
        });

        return NextResponse.json(
            {
                rows: formattedRows,
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
        console.error('Error fetching banners:', error);
        return NextResponse.json(
            { error: 'Failed to fetch banners' },
            { status: 500 }
        );
    }
}
