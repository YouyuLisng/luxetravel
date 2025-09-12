import { z } from 'zod';

export const PriceSchema = z.object({
    adult: z.number().int().min(0),
    childWithBed: z.number().int().min(0),
    childNoBed: z.number().int().min(0),
    infant: z.number().int().min(0),
});

export const TourSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),
    code: z.string().min(1, '缺少團體代碼'),
    departDate: z.coerce.date(),
    returnDate: z.coerce.date(),
    prices: PriceSchema,
    deposit: z.string().optional().nullable(),
    status: z.number().int().min(1).max(4),
    note: z.string().optional().nullable(),
    arrangement: z.string().optional().nullable(),
});

export type TourValues = z.infer<typeof TourSchema>;

// 👉 表單用 schema（多日期 + 價格陣列）
export const TourFormSchema = TourSchema.omit({
    departDate: true,
    returnDate: true,
    code: true,
}).extend({
    dates: z.array(z.date()).min(1, '請至少選擇一個出發日期'),
    prices: z.array(PriceSchema),
});

export type TourFormValues = z.infer<typeof TourFormSchema>;
