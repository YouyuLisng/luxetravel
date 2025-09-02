// /schemas/article.ts
import { z } from 'zod';

/** 共用欄位 */
export const ArticleBaseSchema = z.object({
    title: z.string().min(1, '請輸入標題'),
    subtitle: z.string().min(1, '請輸入副標題'),
    linkUrl: z.string().url('請輸入正確的網址'),
    imageUrl: z.string().min(1, '請上傳圖片'),
});

/**
 * 新增用（Server Action）
 * - countryIds 允許空陣列（預設 []）
 */
export const ArticleCreateSchema = ArticleBaseSchema.extend({
    countryIds: z.array(z.string().min(1)).default([]),
});
export type ArticleCreateValues = z.infer<typeof ArticleCreateSchema>;

/**
 * 編輯用（Server Action）
 * - 若提供 countryIds，視為整組覆蓋；不提供則不變動關聯
 */
export const ArticleEditSchema = ArticleBaseSchema.extend({
    countryIds: z.array(z.string().min(1)).optional(),
});
export type ArticleEditValues = z.infer<typeof ArticleEditSchema>;

/**
 * 前端表單用（若希望「至少選 1 個國家」）
 * - 若你不想強制至少 1 個，改用 ArticleCreateSchema 當 resolver 即可
 */
export const ArticleFormSchema = ArticleBaseSchema.extend({
    countryIds: z.array(z.string().min(1)).min(1, '請至少選擇 1 個國家'),
});
export type ArticleFormValues = z.infer<typeof ArticleFormSchema>;
