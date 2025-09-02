import { z } from 'zod';

export const SubCategorySchema = z.object({
    code: z.string().min(1, '代碼為必填'),
    nameZh: z.string().min(1, '中文名稱為必填'),
    nameEn: z.string().min(1, '英文名稱為必填'),
    imageUrl: z.string().url('圖片網址格式不正確').nullable().optional(),
    enabled: z.boolean(),
    categoryId: z.string().min(1, '必須指定所屬 Category'),
});

export type SubCategoryValues = z.infer<typeof SubCategorySchema>;

export const SubCategoryCreateSchema = SubCategorySchema;
export type SubCategoryCreateValues = z.infer<typeof SubCategoryCreateSchema>;

export const SubCategoryEditSchema = SubCategorySchema.partial({
    code: true,
    categoryId: true,
});
export type SubCategoryEditValues = z.infer<typeof SubCategoryEditSchema>;
