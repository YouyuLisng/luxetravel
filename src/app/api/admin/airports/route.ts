// app/api/admin/airports/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);

// Create 用 schema
const CreateSchema = z.object({
    code: z.string().trim().min(1, '請輸入機場代碼'),
    nameZh: z.string().trim().min(1, '請輸入中文名稱'),
    nameEn: z.string().trim().min(1, '請輸入英文名稱'),
    imageUrl: z.string().trim().url().optional().nullable(),
    enabled: z.boolean().optional(),
    regionId: z.string().trim().min(1, '請選擇地區'),
    countryId: z.string().trim().min(1, '請選擇國家'),
});

// GET /api/admin/airports?q=&enabled=&regionId=&countryId=&page=&pageSize=

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get('pageSize') ?? 10)));

    const where: any = {}; // 需要搜尋/篩選可擴充

    const [total, items] = await Promise.all([
      db.airport.count({ where }),
      db.airport.findMany({
        where,
        include: { region: true, country: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json(
      {
        status: true,
        data: items, // 含 region、country
        pagination: { page, pageSize, total, pageCount },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching airports:', error);
    return NextResponse.json({ status: false, message: 'Failed to fetch airports' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, nameEn, nameZh, regionId, countryId, imageUrl, enabled } = body;

    if (!code || !nameEn || !nameZh || !regionId || !countryId) {
      return NextResponse.json({ status: false, message: '缺少必要欄位' }, { status: 400 });
    }

    // 可加上檢查 region/country 是否存在與啟用
    const created = await db.airport.create({
      data: { code, nameEn, nameZh, regionId, countryId, imageUrl: imageUrl ?? null, enabled: enabled ?? true },
    });

    return NextResponse.json(
      { status: true, message: `機場 ${created.code} 建立成功`, data: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating airport:', error);
    return NextResponse.json({ status: false, message: 'Internal Server Error' }, { status: 500 });
  }
}