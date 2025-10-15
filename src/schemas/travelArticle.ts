// src/schemas/travelArticle.ts
import { z } from 'zod';

/** 新增 TravelArticle 的欄位驗證 */
export const TravelArticleCreateSchema = z.object({
    title: z.string().min(1, '請輸入標題'),
    subtitle: z.string().min(1, '請輸入副標題'),
    linkUrl: z.string().url('請輸入正確的網址'),
    imageUrl: z.string().min(1, '請上傳圖片'),
    countryId: z.string().min(1, '請選擇國家'),
});

/** 編輯 TravelArticle 的欄位驗證（與新增相同，可視需要調整必填） */
export const TravelArticleEditSchema = TravelArticleCreateSchema;

export type TravelArticleCreateValues = z.infer<
    typeof TravelArticleCreateSchema
>;
export type TravelArticleEditValues = z.infer<typeof TravelArticleEditSchema>;
