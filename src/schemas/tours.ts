import { z } from 'zod';

export const PriceSchema = z.object({
    adult: z.string().optional().nullable(),
    childWithBed: z.string().optional().nullable(),
    childNoBed: z.string().optional().nullable(),
    childExtraBed: z.string().optional().nullable(),
    infant: z.string().optional().nullable(),
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
});

export type TourValues = z.infer<typeof TourSchema>;

// 👉 表單 Schema
export const TourFormSchema = z.object({
    productId: z.string().min(1),
    tours: z.array(
        z.object({
            date: z.date(),
            prices: PriceSchema,
            deposit: z.string().optional().nullable(),
            status: z.number().int().min(1).max(4),
            note: z.string().optional().nullable(),
        })
    ),
});

export type TourFormValues = z.infer<typeof TourFormSchema>;
