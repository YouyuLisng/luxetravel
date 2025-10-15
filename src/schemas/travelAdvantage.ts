import { z } from 'zod';

/** 新增用（必填 moduleId / imageUrl / title / content） */
export const TravelAdvantageCreateSchema = z.object({
    moduleId: z.string().min(1, '模組 ID 必填'),
    imageUrl: z.string().min(1, '請上傳或貼上圖片 URL'),
    title: z.string().min(1, '標題必填'),
    content: z.string().min(1, '內容必填'),
    order: z.number().int().nonnegative().default(0),
});
export type TravelAdvantageCreateValues = z.infer<
    typeof TravelAdvantageCreateSchema
>;

/** 編輯用（一般不改 moduleId） */
export const TravelAdvantageEditSchema = z.object({
    imageUrl: z.string().min(1, '請上傳或貼上圖片 URL'),
    title: z.string().min(1, '標題必填'),
    content: z.string().min(1, '內容必填'),
    order: z.number().int().nonnegative(),
});
export type TravelAdvantageEditValues = z.infer<
    typeof TravelAdvantageEditSchema
>;
