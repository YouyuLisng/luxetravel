import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

// 取得單一 Banner
export async function GET(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const banner = await db.banner.findUnique({
            where: { id },
        });

        if (!banner) {
            return NextResponse.json(
                { status: false, message: '找不到指定的 Banner' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: `已取得 Banner「${banner.title || banner.id}」`,
            data: banner,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch banner' },
            { status: 500 }
        );
    }
}

// 更新 Banner
export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // const currentUser = await getCurrentUser();
    // if (!currentUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const { imageUrl, title, subtitle, linkText, linkUrl, order } = body;

    try {
        const updatedBanner = await db.banner.update({
            where: { id },
            data: {
                imageUrl,
                title,
                subtitle,
                linkText,
                linkUrl,
                order: typeof order === 'number' ? order : undefined, // 僅在有傳入數字時更新
            },
        });

        return NextResponse.json({
            status: true,
            message: `Banner「${updatedBanner.title || updatedBanner.id}」更新成功`,
            data: updatedBanner,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to update banner' },
            { status: 500 }
        );
    }
}

// 刪除 Banner
export async function DELETE(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const deletedBanner = await db.banner.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: `Banner「${deletedBanner.title || deletedBanner.id}」已成功刪除`,
            data: deletedBanner,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to delete banner' },
            { status: 500 }
        );
    }
}
