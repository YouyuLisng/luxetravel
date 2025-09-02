import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
    SubCategoryCreateSchema,
    type SubCategoryCreateValues,
} from '@/schemas/subCategory';

/** GET /api/admin/sub-category?page=&pageSize=&q= */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const pageSize = Math.max(
            1,
            Math.min(100, Number(searchParams.get('pageSize') ?? 10))
        );
        const q = searchParams.get('q')?.trim();

        const where: any = q
            ? {
                  OR: [
                      { code: { contains: q, mode: 'insensitive' } },
                      { nameZh: { contains: q, mode: 'insensitive' } },
                      { nameEn: { contains: q, mode: 'insensitive' } },
                  ],
              }
            : {};

        const [total, rows] = await Promise.all([
            db.subCategory.count({ where }),
            db.subCategory.findMany({
                where,
                include: { category: { select: { id: true, nameZh: true } } },
                orderBy: { createdAt: 'desc' },
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
    } catch (err) {
        console.error('GET /sub-category error:', err);
        return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
    }
}

/** POST /api/admin/sub-category - 新增 SubCategory */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = SubCategoryCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: '欄位格式錯誤' },
                { status: 400 }
            );
        }

        const { code, nameZh, nameEn, imageUrl, enabled, categoryId } =
            parsed.data as SubCategoryCreateValues;
        const upper = code.toUpperCase();

        // 檢查大分類是否存在
        const categoryExists = await db.category.findUnique({
            where: { id: categoryId },
        });
        if (!categoryExists) {
            return NextResponse.json(
                { error: '找不到對應的大分類' },
                { status: 400 }
            );
        }

        // 檢查 code 唯一性
        const dup = await db.subCategory.findUnique({ where: { code: upper } });
        if (dup) {
            return NextResponse.json(
                { error: `代碼已存在：${upper}` },
                { status: 400 }
            );
        }

        const data = await db.subCategory.create({
            data: {
                code: upper,
                nameZh: nameZh.trim(),
                nameEn: nameEn.trim(),
                imageUrl: imageUrl === null ? null : imageUrl?.trim(),
                enabled: enabled ?? true,
                categoryId,
            },
            include: { category: { select: { id: true, nameZh: true } } },
        });

        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (err) {
        console.error('POST /sub-category error:', err);
        return NextResponse.json({ error: '新增失敗' }, { status: 500 });
    }
}
