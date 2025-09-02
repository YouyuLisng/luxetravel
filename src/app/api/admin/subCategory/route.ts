import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
    SubCategoryCreateSchema,
    type SubCategoryCreateValues,
} from '@/schemas/subCategory';

/** GET /api/admin/sub-category - 取得所有 SubCategory */
export async function GET() {
    try {
        const data = await db.subCategory.findMany({
            include: { category: { select: { id: true, nameZh: true } } }, // ✅ 帶出大類別中文名稱
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ status: true, data });
    } catch (err) {
        console.error('GET /sub-category error:', err);
        return NextResponse.json(
            { status: false, message: '讀取失敗' },
            { status: 500 }
        );
    }
}

/** POST /api/admin/sub-category - 新增 SubCategory */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = SubCategoryCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { status: false, message: '欄位格式錯誤' },
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
                { status: false, message: '找不到對應的大分類' },
                { status: 400 }
            );
        }

        // 檢查 code 唯一性
        const dup = await db.subCategory.findUnique({ where: { code: upper } });
        if (dup) {
            return NextResponse.json(
                { status: false, message: `代碼已存在：${upper}` },
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
            include: { category: { select: { id: true, nameZh: true } } }, // ✅ 新增時也帶出大類別中文名稱
        });

        return NextResponse.json({ status: true, data });
    } catch (err) {
        console.error('POST /sub-category error:', err);
        return NextResponse.json(
            { status: false, message: '新增失敗' },
            { status: 500 }
        );
    }
}
