import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{ id: string }>;
}

/** 取得單一模組 */
export async function GET(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const moduleItem = await db.module.findUnique({
            where: { id },
            // 如需關聯一起帶出，可加上 select/include
            // include: { concerns: true, advantages: true },
        });

        if (!moduleItem) {
            return NextResponse.json(
                { status: false, message: 'Module not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: `成功取得 Module：${moduleItem.title || moduleItem.key}`,
            data: moduleItem,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch module' },
            { status: 500 }
        );
    }
}

/** 更新單一模組 */
export async function PUT(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { key, title, subtitle, type } = body;

    try {
        const updatedModule = await db.module.update({
            where: { id },
            data: { key, title, subtitle, type },
        });

        return NextResponse.json({
            status: true,
            message: `Module「${updatedModule.title || updatedModule.key}」更新成功`,
            data: updatedModule,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to update module' },
            { status: 500 }
        );
    }
}

/** 刪除單一模組 */
export async function DELETE(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const deletedModule = await db.module.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: `Module「${deletedModule.title || deletedModule.key}」已成功刪除`,
            data: deletedModule,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to delete module' },
            { status: 500 }
        );
    }
}
