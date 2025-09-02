import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, linkUrl, icon, order, isActive, parentId } = body;

    if (!title) {
      return NextResponse.json({ error: '請填寫標題 title' }, { status: 400 });
    }

    const menu = await db.menu.create({
      data: {
        title,
        linkUrl,
        icon,
        order: order ?? 0,
        isActive: isActive ?? true,
        parentId: parentId ?? null,
      },
    });

    return NextResponse.json({
      status: true,
      message: `Menu「${menu.title}」建立成功`,
      data: menu,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function GET() {
  try {
    const menus = await db.menu.findMany({
      where: {
        parentId: null,
      },
      orderBy: { order: 'asc' },
      include: {
        children: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      status: true,
      message: '成功取得選單列表',
      data: menus,
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 });
  }
}

