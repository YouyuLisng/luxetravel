import { z } from 'zod';

export const TravelInquirySchema = z.object({
    // 基本資料
    travelType: z.string().min(1, '旅遊形式必填'),
    contactName: z.string().min(1, '聯絡人必填'),
    gender: z.enum(['小姐', '先生']).optional(),
    phone: z.string().min(5, '請輸入有效手機'),
    lineId: z.string().optional().nullable(),

    // 聯絡方式與時間
    contactMethod: z.array(z.string()).min(1, '請選擇聯絡方式'),
    contactTime: z.string().min(1, '請輸入聯絡時間'),

    // 想詢問的團體行程（改為非必填）
    inquiryTour: z.string().optional().nullable(),

    // 來源
    source: z.array(z.string()).default([]),

    // 每人預算
    budget: z.string().min(1, '請選擇每人預算'),

    // 想去的地區（多選）
    regions: z.array(z.string()).min(1, '請選擇想去的地區'),

    // 人數與天數
    adults: z.number().int().min(1, '至少 1 位大人'),
    children: z.number().int().optional().default(0),
    infants: z.number().int().optional().default(0),
    days: z.number().int().min(1, '請輸入旅遊天數'),

    // 出發日期
    departDate: z.string().min(1, '請輸入出發日期'),

    // 心願清單與其他需求
    wishlist: z.string().max(100, '心願清單限100字').optional().nullable(),
});

export type TravelInquiryValues = z.infer<typeof TravelInquirySchema>;
