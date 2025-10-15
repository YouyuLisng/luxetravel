import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
// import getCurrentUser from '@/action/getCurrentUser';

export async function POST(request: Request) {
    // const currentUser = await getCurrentUser();
    // if (!currentUser) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    try {
        const body = await request.json();
        const { key, title, subtitle, type } = body;

        if (!key || !title || !type) {
            return NextResponse.json(
                { error: 'Missing required fields (key, title, type)' },
                { status: 400 }
            );
        }

        // 檢查 key 是否重複
        const exists = await db.module.findUnique({ where: { key } });
        if (exists) {
            return NextResponse.json(
                { error: `Module key「${key}」已存在` },
                { status: 409 }
            );
        }

        const createdModule  = await db.module.create({
            data: {
                key,
                title,
                subtitle,
                type,
            },
        });

        return NextResponse.json(
            {
                status: true,
                message: `Module「${createdModule .title || createdModule .key}」建立成功`,
                data: module,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating module:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const modules = await db.module.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({
            status: true,
            message: '成功取得 Module 列表',
            data: modules,
        });
    } catch (error) {
        console.error('Error fetching modules:', error);
        return NextResponse.json(
            { error: 'Failed to fetch modules' },
            { status: 500 }
        );
    }
}
