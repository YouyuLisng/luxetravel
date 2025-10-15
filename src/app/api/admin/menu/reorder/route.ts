import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        await Promise.all(
            body.map((item: any) =>
                db.menu.update({
                    where: { id: item.id },
                    data: {
                        order: item.order,
                        parentId: item.parentId ?? null,
                    },
                })
            )
        );

        return NextResponse.json({ status: true, message: '選單順序更新成功' });
    } catch (error) {
        console.error('排序更新失敗：', error);
        return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
}
