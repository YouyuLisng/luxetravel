import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CityCreateSchema } from '@/schemas/city';

/** GET /api/admin/city - 取得所有 City */
export async function GET() {
    try {
        const data = await db.city.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ status: true, data });
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

/** POST /api/admin/city - 新增 City */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CityCreateSchema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
                { status: 400 }
            );

        const { code, nameZh, nameEn, country, imageUrl, enabled } =
            parsed.data;
        const upper = code.toUpperCase();

        // 檢查唯一
        const dup = await db.city.findUnique({ where: { code: upper } });
        if (dup)
            return NextResponse.json(
                { status: false, message: `代碼已存在：${upper}` },
                { status: 400 }
            );

        const data = await db.city.create({
            data: {
                code: upper,
                nameZh: nameZh.trim(),
                nameEn: nameEn.trim(),
                country: country.trim(),
                imageUrl: imageUrl === null ? null : imageUrl?.trim(),
                enabled: enabled ?? true,
            },
        });

        return NextResponse.json({ status: true, data });
    } catch (err) {
        return NextResponse.json(
            { status: false, message: '建立失敗' },
            { status: 500 }
        );
    }
}
