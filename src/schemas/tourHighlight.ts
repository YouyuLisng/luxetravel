import { z } from 'zod';

export const TourHighlightCreateSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),
    imageUrl: z.string().url('請輸入正確的圖片網址'),
    layout: z.number().min(1, '請輸入版型'),
    title: z.string().min(1, '請輸入標題'),
    subtitle: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    order: z.number().min(0, '請輸入順序'),
});

export const TourHighlightEditSchema = TourHighlightCreateSchema.partial();

export type TourHighlightCreateValues = z.infer<
    typeof TourHighlightCreateSchema
>;
export type TourHighlightEditValues = z.infer<typeof TourHighlightEditSchema>;
