// src/schemas/travelConcern.ts
import { z } from 'zod';

/** 新增用 */
export const TravelConcernCreateSchema = z.object({
    moduleId: z.string().min(1, 'Module ID 必填'),
    number: z
        .string()
        .min(1, '編號必填')
        .regex(/^0[1-5]$/, '編號必須為 01~05'),
    content: z.string().min(1, '內容必填'),
    order: z.number().int('必須是整數').nonnegative('不可為負數'),
});
export type TravelConcernCreateValues = z.infer<
    typeof TravelConcernCreateSchema
>;

/** 編輯用（可改 number、content、order） */
export const TravelConcernEditSchema = z.object({
    number: z
        .string()
        .min(1, '編號必填')
        .regex(/^0[1-5]$/, '編號必須為 01~05'),
    content: z.string().min(1, '內容必填'),
    order: z.number().int('必須是整數').nonnegative('不可為負數'),
});
export type TravelConcernEditValues = z.infer<typeof TravelConcernEditSchema>;
