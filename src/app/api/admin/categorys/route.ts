import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const CreateSchema = z.object({
    code: z.string().trim().min(1, '請輸入代碼'),
    nameEn: z.string().trim().min(1, '請輸入英文名稱'),
    nameZh: z.string().trim().min(1, '請輸入中文名稱'),
    imageUrl: z.string().trim().url().optional().nullable(),
    enabled: z.boolean().optional().default(true),
});

/**
 * GET /api/admin/categorys?page=&pageSize=&q=
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );
        const q = searchParams.get('q')?.trim();

        const where: Prisma.CategoryWhereInput = q
            ? {
                  OR: [
                      {
                          code: {
                              contains: q,
                              mode: Prisma.QueryMode.insensitive,
                          },
                      },
                      {
                          nameEn: {
                              contains: q,
                              mode: Prisma.QueryMode.insensitive,
                          },
                      },
                      {
                          nameZh: {
                              contains: q,
                              mode: Prisma.QueryMode.insensitive,
                          },
                      },
                  ],
              }
            : {};

        const [total, rows] = await Promise.all([
            db.category.count({ where }),
            db.category.findMany({
                where,
                orderBy: [{ nameZh: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        return NextResponse.json(
            {
                rows,
                pagination: {
                    page,
                    pageSize,
                    total,
                    pageCount: Math.max(1, Math.ceil(total / pageSize)),
                },
            },
            { status: 200 }
        );
    } catch (e) {
        console.error('GET /categorys error:', e);
        return NextResponse.json(
            { error: '取得大分類列表失敗' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/categorys
 */
export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const parsed = CreateSchema.safeParse(json);
        if (!parsed.success) {
            const msg = parsed.error.issues[0]?.message ?? '資料驗證失敗';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        const p = parsed.data;
        const code = p.code.toUpperCase();

        // 唯一性檢查
        const dup = await db.category.findUnique({ where: { code } });
        if (dup) {
            return NextResponse.json(
                { error: `代碼已存在：${code}` },
                { status: 409 }
            );
        }

        const created = await db.category.create({
            data: {
                code,
                nameEn: p.nameEn.trim(),
                nameZh: p.nameZh.trim(),
                imageUrl: p.imageUrl ?? null,
                enabled: p.enabled ?? true,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: `已新增大分類「${created.nameZh}」`,
                data: created,
            },
            { status: 201 }
        );
    } catch (e) {
        console.error('POST /categorys error:', e);
        return NextResponse.json({ error: '新增大分類失敗' }, { status: 500 });
    }
}
