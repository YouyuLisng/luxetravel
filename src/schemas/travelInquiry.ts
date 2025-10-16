import { z } from 'zod';

export const TravelInquirySchema = z.object({
    travelType: z.string().min(1, '旅遊形式必填'), // 旅遊形式
    contactName: z.string().min(1, '聯絡人必填'), // 聯絡人
    gender: z.enum(['小姐', '先生']).optional(), // 稱謂
    phone: z.string().min(5, '請輸入有效手機'), // 手機
    lineId: z.string().optional().nullable(), // LINE ID

    contactMethod: z.array(z.string()).min(1, '請選擇聯絡方式'), // 聯絡方式
    contactTime: z.string().min(1, '請輸入聯絡時間'), // 聯絡時間

    inquiryTour: z.string().optional().nullable(), // 想詢問的團體行程（非必填）
    source: z.array(z.string()).default([]), // 來源
    budget: z.string().min(1, '請選擇每人預算'), // 每人預算
    regions: z.array(z.string()).min(1, '請選擇想去的地區'), // 想去的地區（多選）

    adults: z.number().int().min(1, '至少 1 位大人'), // 大人人數
    children: z.number().int().optional().default(0), // 小孩人數
    infants: z.number().int().optional().default(0), // 嬰兒人數
    days: z.number().int().min(1, '請輸入旅遊天數'), // 旅遊天數

    departDate: z.string().min(1, '請輸入出發日期'), // 出發日期
    wishlist: z.string().max(100, '心願清單限100字').optional().nullable(), // 心願清單
});

export type TravelInquiryValues = z.infer<typeof TravelInquirySchema>;
