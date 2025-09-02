// app/api/admin/categorys/route.ts
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

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q')?.trim() || '';
        const limit = Number.parseInt(searchParams.get('limit') ?? '100', 10);
        const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10);
        const take = Number.isFinite(limit)
            ? Math.min(Math.max(limit, 1), 100)
            : 100;
        const skip = Number.isFinite(offset) && offset > 0 ? offset : 0;

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

        const [rows, total] = await Promise.all([
            db.category.findMany({
                where,
                skip,
                take,
                orderBy: [{ nameZh: 'asc' }, { createdAt: 'desc' }],
            }),
            db.category.count({ where }),
        ]);

        return NextResponse.json({
            status: true,
            message: `已取得大分類列表（本次 ${rows.length} 筆 / 總計 ${total} 筆）`,
            data: rows,
            pagination: { total, offset: skip, limit: take },
        });
    } catch (e) {
        console.error('GET /categorys error:', e);
        return NextResponse.json(
            { status: false, message: '取得大分類列表失敗' },
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

        const p = parsed.data;
        const code = p.code.toUpperCase();

        // 唯一性檢查
        const dup = await db.category.findUnique({ where: { code } });
        if (dup) {
            return NextResponse.json(
                { status: false, message: `代碼已存在：${code}` },
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

        return NextResponse.json({
            status: true,
            message: `已新增大分類「${created.nameZh}」`,
            data: created,
        });
    } catch (e) {
        console.error('POST /categorys error:', e);
        return NextResponse.json(
            { status: false, message: '新增大分類失敗' },
            { status: 500 }
        );
    }
}
