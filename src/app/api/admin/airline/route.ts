import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  AirlineCreateSchema,
  type AirlineCreateValues,
} from '@/schemas/airline';

/** GET /api/admin/airline - 取得全部 Airline */
export async function GET() {
  try {
    const data = await db.airline.findMany({
      orderBy: { code: 'asc' },
    });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
  }
}

/** POST /api/admin/airline - 新增 Airline */
export async function POST(req: Request) {
  try {
    const json = (await req.json()) as AirlineCreateValues;
    const parsed = AirlineCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: '欄位格式錯誤' }, { status: 400 });
    }

    const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
    const upper = code.toUpperCase();

    // 唯一碼檢查
    const dup = await db.airline.findUnique({ where: { code: upper } });
    if (dup) {
      return NextResponse.json({ error: `代碼已存在：${upper}` }, { status: 409 });
    }

    const data = await db.airline.create({
      data: {
        code: upper,
        nameZh: nameZh.trim(),
        nameEn: nameEn.trim(),
        imageUrl: imageUrl === null ? null : imageUrl?.trim(),
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json({ success: '新增成功', data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: '建立失敗' }, { status: 500 });
  }
}
