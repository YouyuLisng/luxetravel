import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Menu } from '@prisma/client';

// 擴充 Prisma Menu，加上 children 屬性
export type MenuWithChildren = Menu & { children: MenuWithChildren[] };

// 遞迴組裝樹狀結構
function buildMenuTree(
  items: Menu[],
  parentId: string | null = null
): MenuWithChildren[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      ...item,
      children: buildMenuTree(items, item.id),
    }));
}

// ------------------ POST ------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, linkUrl, icon, order, isActive, parentId } = body;

    if (!title) {
      return NextResponse.json({ error: '請填寫標題 title' }, { status: 400 });
    }

    // 如果有 parentId，檢查是否存在
    if (parentId) {
      const parentMenu = await db.menu.findUnique({ where: { id: parentId } });
      if (!parentMenu) {
        return NextResponse.json(
          { error: `指定的 parentId(${parentId}) 不存在` },
          { status: 400 }
        );
      }
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

    return NextResponse.json(
      {
        status: true,
        message: `Menu「${menu.title}」建立成功`,
        data: menu,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ------------------ GET ------------------
export async function GET() {
  try {
    // 抓全部 menu
    const flatMenus = await db.menu.findMany({
      orderBy: { order: 'asc' },
    });

    // 組裝成樹狀結構 (不限層數)
    const menuTree = buildMenuTree(flatMenus);

    return NextResponse.json({
      status: true,
      message: '成功取得選單列表',
      data: menuTree,
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}
