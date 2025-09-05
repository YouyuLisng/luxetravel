// src/schemas/tours.ts
import { z } from 'zod';

export const TourSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),
    code: z.string().min(1, '缺少團體代碼'),
    departDate: z.coerce.date(),
    returnDate: z.coerce.date(),
    adult: z.number().int().min(0),
    childWithBed: z.number().int().min(0),
    childNoBed: z.number().int().min(0),
    infant: z.number().int().min(0),
    deposit: z.string().optional().nullable(),
    status: z.number().int().min(1).max(4),
    note: z.string().optional().nullable(),
    arrangement: z.string().optional().nullable(),
});

export type TourValues = z.infer<typeof TourSchema>;

// 👉 專門給表單用的 schema（多日期）
export const TourFormSchema = TourSchema.omit({
    departDate: true,
    returnDate: true,
}).extend({
    dates: z.array(z.date()).min(1, '請至少選擇一個出發日期'),
});

export type TourFormValues = z.infer<typeof TourFormSchema>;
