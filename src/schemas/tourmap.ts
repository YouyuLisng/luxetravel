import { z } from 'zod';

export const TourMapCreateSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),
    imageUrl: z.string().min(1, '缺少圖片網址'),
    content: z.string().nullable().optional(),
});

export const TourMapEditSchema = TourMapCreateSchema.partial();

export type TourMapCreateValues = z.infer<typeof TourMapCreateSchema>;
export type TourMapEditValues = z.infer<typeof TourMapEditSchema>;
