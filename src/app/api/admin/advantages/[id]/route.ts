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
        const advantage = await db.travelAdvantage.findUnique({
            where: { id },
        });

        if (!advantage) {
            return NextResponse.json(
                { error: `Advantage with ID ${id} not found` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            data: advantage,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch advantage' },
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
    const { imageUrl, title, content, moduleId } = body;

    try {
        const updatedAdvantage = await db.travelAdvantage.update({
            where: { id },
            data: {
                imageUrl,
                title,
                content,
                moduleId,
            },
        });

        return NextResponse.json({
            status: true,
            message: `Advantage「${updatedAdvantage.title || updatedAdvantage.id}」更新成功`,
            data: updatedAdvantage,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to update advantage' },
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
        const deletedAdvantage = await db.travelAdvantage.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: `Advantage「${deletedAdvantage.title || deletedAdvantage.id}」已成功刪除`,
            data: deletedAdvantage,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to delete advantage' },
            { status: 500 }
        );
    }
}
