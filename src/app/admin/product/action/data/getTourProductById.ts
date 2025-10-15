// src/app/admin/product/action/product.ts
'use server';

import { db } from '@/lib/db';

export async function getTourProductById(id: string) {
    if (!id) return { error: '缺少 ID' };

    const data = await db.tourProduct.findUnique({
        where: { id },
    });

    if (!data) return { error: '找不到產品' };

    // 把 nullable 欄位轉成 undefined，避免 RHF defaultValues 出錯
    return {
        ...data,
        subCategoryId: data.subCategoryId ?? undefined,
        priceMax: data.priceMax ?? undefined,
        namePrefix: data.namePrefix ?? undefined,
        description: data.description ?? undefined,
        note: data.note ?? undefined,
        staff: data.staff ?? undefined,
        reminder: data.reminder ?? undefined,
        policy: data.policy ?? undefined,
    };
}
