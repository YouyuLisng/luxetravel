import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
// import getCurrentUser from '@/action/getCurrentUser';
import type { NextRequest } from 'next/server';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const concern = await db.travelConcern.findUnique({ where: { id } });

        if (!concern) {
            return NextResponse.json(
                { error: 'Concern not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: `成功取得 Concern「${concern.number || concern.id}」`,
            data: concern,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch concern' },
            { status: 500 }
        );
    }
}

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
    const { number, content, order, moduleId } = body;

    try {
        const updatedConcern = await db.travelConcern.update({
            where: { id },
            data: {
                number,
                content,
                order,
                moduleId,
            },
        });

        return NextResponse.json({
            status: true,
            message: `Concern「${updatedConcern.number || updatedConcern.id}」更新成功`,
            data: updatedConcern,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to update concern' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: Props) {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    try {
        const deletedConcern = await db.travelConcern.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: `Concern「${deletedConcern.number || deletedConcern.id}」已成功刪除`,
            data: deletedConcern,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to delete concern' },
            { status: 500 }
        );
    }
}
