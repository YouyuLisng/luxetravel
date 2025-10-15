import { z } from 'zod';

export const TravelInquirySchema = z.object({
    travelType: z.string().min(1, '旅遊形式必填'),
    contactName: z.string().min(1, '聯絡人必填'),
    gender: z.enum(['小姐', '先生']).optional(),
    phone: z.string().min(5, '請輸入有效手機'),
    lineId: z.string().optional().nullable(),
    contactMethod: z.array(z.string()).default([]),
    contactTime: z.string().min(1, '請輸入聯絡時間'),
    source: z.array(z.string()).default([]),
    note: z.string().max(100).optional().nullable(),
    adults: z.number().int().min(1, '至少 1 位大人'),
    children: z.number().int().optional().default(0),
    infants: z.number().int().optional().default(0),
    itinerary: z.string().min(1, '請輸入行程'),
    departDate: z.string().min(1, '請輸入出發日期'),
});

export type TravelInquiryValues = z.infer<typeof TravelInquirySchema>;
