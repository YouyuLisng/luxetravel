// app/api/admin/countries/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const CreateSchema = z.object({
    code: z.string().trim().min(1),
    nameZh: z.string().trim().min(1),
    nameEn: z.string().trim().min(1),
    imageUrl: z.string().trim().url().optional().nullable(),
    enabled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get('q') || '').trim();
        const enabledParam = searchParams.get('enabled'); // 'true' | 'false' | null
        const page = Math.max(1, Number(searchParams.get('page') || 1));
        const pageSize = Math.min(
            100,
            Math.max(1, Number(searchParams.get('pageSize') || 10))
        );

        const where: Prisma.CountryWhereInput = {};

        if (q) {
            const mode: Prisma.QueryMode = Prisma.QueryMode.insensitive;
            where.OR = [
                { code: { contains: q, mode } },
                { nameZh: { contains: q, mode } },
                { nameEn: { contains: q, mode } },
            ];
        }

        if (enabledParam === 'true') where.enabled = true;
        if (enabledParam === 'false') where.enabled = false;

        const [total, rows] = await Promise.all([
            db.country.count({ where }),
            db.country.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const pageCount = Math.max(1, Math.ceil(total / pageSize));

        return NextResponse.json({
            status: true,
            message: `已取得國家列表（第 ${page}/${pageCount} 頁，共 ${total} 筆）`,
            data: rows,
            pagination: { page, pageSize, total, pageCount },
        });
    } catch (e) {
        console.error('GET /countries error:', e);
        return NextResponse.json(
            { status: false, message: '查詢失敗' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const parsed = CreateSchema.safeParse(json);
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message ?? '資料驗證失敗';
            return NextResponse.json(
                { status: false, message: msg },
                { status: 400 }
            );
        }

        const { code, nameZh, nameEn, imageUrl, enabled } = parsed.data;
        const upper = code.toUpperCase();

        // 檢查 Country.code 唯一
        const dup = await db.country.findUnique({ where: { code: upper } });
        if (dup) {
            return NextResponse.json(
                { status: false, message: `代碼已存在：${upper}` },
                { status: 409 }
            );
        }

        const created = await db.$transaction(async (tx) => {
            const country = await tx.country.create({
                data: {
                    code: upper,
                    nameZh: nameZh.trim(),
                    nameEn: nameEn.trim(),
                    imageUrl: imageUrl === null ? null : imageUrl?.trim(),
                    enabled: enabled ?? true,
                },
            });

            // 同步 ArticleCountry（name 為 unique，使用 nameEn 當 name）
            await tx.articleCountry.upsert({
                where: { name: nameEn.trim() }, // unique
                update: { nameZh: nameZh.trim(), code: upper },
                create: {
                    name: nameEn.trim(),
                    nameZh: nameZh.trim(),
                    code: upper,
                },
            });

            return country;
        });

        return NextResponse.json({
            status: true,
            message: `已建立國家「${created.nameZh}」`,
            data: created,
        });
    } catch (e) {
        console.error('POST /countries error:', e);
        return NextResponse.json(
            { status: false, message: '建立失敗' },
            { status: 500 }
        );
    }
}
