import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    AirlineCreateSchema,
    type AirlineCreateValues,
} from '@/schemas/airline';

/** GET /api/admin/airline - 取得 Airline 列表 (支援分頁) */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // 👉 沒帶 page & pageSize → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.airline.findMany({
                orderBy: { code: 'asc' },
            });

            return NextResponse.json({
                status: true,
                message: '成功取得全部 Airline 清單',
                rows,
                pagination: null, // 沒有分頁
            });
        }

        // 👉 有帶參數才走分頁
        const page = Math.max(1, parseInt(pageParam ?? '1', 10));
        const pageSize = Math.max(1, parseInt(pageSizeParam ?? '10', 10));
        const skip = (page - 1) * pageSize;

        const [rows, total] = await Promise.all([
            db.airline.findMany({
                skip,
                take: pageSize,
                orderBy: { code: 'asc' },
            }),
            db.airline.count(),
        ]);

        return NextResponse.json({
            status: true,
            message: '成功取得 Airline 分頁清單',
            rows,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize),
            },
        });
    } catch (err) {
        console.error('Error fetching airlines:', err);
        return NextResponse.json(
            { status: false, error: '讀取失敗' },
            { status: 500 }
        );
    }
}

/** POST /api/admin/airline - 新增 Airline */
export async function POST(req: Request) {
    try {
        const json = (await req.json()) as AirlineCreateValues;
        const parsed = AirlineCreateSchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
        const upper = code.toUpperCase();

        // 唯一碼檢查
        const dup = await db.airline.findUnique({ where: { code: upper } });
        if (dup) {
            return NextResponse.json(
                { error: `代碼已存在：${upper}` },
                { status: 409 }
            );
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

        return NextResponse.json(
            { success: '新增成功', data },
            { status: 201 }
        );
    } catch (err) {
        return NextResponse.json({ error: '建立失敗' }, { status: 500 });
    }
}
