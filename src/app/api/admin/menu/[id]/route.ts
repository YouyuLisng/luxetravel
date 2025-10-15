import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, linkUrl, icon, order, isActive, parentId } = body;

    if (!title) {
        return NextResponse.json(
            { error: '請填寫標題 title' },
            { status: 400 }
        );
    }

    try {
        const updatedMenu = await db.menu.update({
            where: { id },
            data: {
                title,
                linkUrl,
                icon,
                order: order ?? 0,
                isActive: isActive ?? true,
                parentId: parentId ?? null, // ✅ 更新 parentId
            },
        });

        return NextResponse.json({
            status: true,
            message: `Menu「${updatedMenu.title}」更新成功`,
            data: updatedMenu,
        });
    } catch (error) {
        console.error('Error updating menu:', error);
        return NextResponse.json(
            { error: 'Failed to update menu' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: Props) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const deletedMenu = await db.menu.delete({ where: { id } });
        return NextResponse.json({
            status: true,
            message: `Menu「${deletedMenu.title}」已成功刪除`,
            data: deletedMenu,
        });
    } catch (error) {
        console.error('Error deleting menu:', error);
        return NextResponse.json(
            { error: 'Failed to delete menu' },
            { status: 500 }
        );
    }
}
