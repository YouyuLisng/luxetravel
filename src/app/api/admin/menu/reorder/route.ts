import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { items } = await req.json(); // [{ id, order, parentId }]
        
        const updates = items.map((item: any) =>
            db.menu.update({
                where: { id: item.id },
                data: {
                    order: item.order,
                    parentId: item.parentId,
                },
            })
        );

        await Promise.all(updates);

        return NextResponse.json({ status: true, message: '選單順序更新成功' });
    } catch (error) {
        console.error('排序更新失敗：', error);
        return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
}
