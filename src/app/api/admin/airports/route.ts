// app/api/admin/airports/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

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

/**
 * GET /api/admin/airports
 * Query: ?q=&enabled=&regionId=&countryId=&page=&pageSize=
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');

        // 🔎 where 條件
        const where: any = {};

        const q = searchParams.get('q');
        if (q) {
            where.OR = [
                { code: { contains: q, mode: 'insensitive' } },
                { nameZh: { contains: q, mode: 'insensitive' } },
                { nameEn: { contains: q, mode: 'insensitive' } },
            ];
        }

        const enabled = searchParams.get('enabled');
        if (enabled === 'true') where.enabled = true;
        if (enabled === 'false') where.enabled = false;

        const regionId = searchParams.get('regionId');
        if (regionId) where.regionId = regionId;

        const countryId = searchParams.get('countryId');
        if (countryId) where.countryId = countryId;

        // ➤ 如果 page & pageSize 都沒帶 → 回傳全部
        if (!pageParam && !pageSizeParam) {
            const rows = await db.airport.findMany({
                where,
                include: { region: true, country: true },
                orderBy: { createdAt: 'desc' },
            });

            return NextResponse.json(
                {
                    status: true,
                    message: '成功取得全部 Airport 清單',
                    rows,
                    pagination: null, // 沒有分頁
                },
                { status: 200 }
            );
        }

        // ➤ 否則照分頁查詢
        const page = Math.max(1, Number(pageParam ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(pageSizeParam ?? 10))
        );

        const [total, rows] = await Promise.all([
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
                message: '成功取得 Airport 分頁清單',
                rows,
                pagination: { page, pageSize, total, pageCount },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching airports:', error);
        return NextResponse.json(
            { status: false, error: 'Failed to fetch airports' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/airports
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = CreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤', issues: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { code, nameEn, nameZh, regionId, countryId, imageUrl, enabled } =
            parsed.data;

        const created = await db.airport.create({
            data: {
                code,
                nameEn,
                nameZh,
                regionId,
                countryId,
                imageUrl: imageUrl ?? null,
                enabled: enabled ?? true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: `機場 ${created.code} 建立成功`,
                data: created,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating airport:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
