import { z } from 'zod';

export const LexiconBaseSchema = z.object({
    title: z.string().min(1, '標題必填'),
    type: z.string().min(1, '類型必填'),
    context: z.string().min(1, '內容必填'),
});

/** 新增 */
export const LexiconCreateSchema = LexiconBaseSchema;
export type LexiconCreateValues = z.infer<typeof LexiconCreateSchema>;

/** 編輯 */
export const LexiconEditSchema = LexiconBaseSchema.extend({
    id: z.string().min(1, 'ID 必填'),
});
export type LexiconEditValues = z.infer<typeof LexiconEditSchema>;
