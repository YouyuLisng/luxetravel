import { z } from 'zod';

export const CarInquirySchema = z.object({
  contactName: z.string().min(1),              // 聯絡人
  gender: z.enum(['先生', '小姐']),            // 稱謂
  phone: z.string().min(1),                    // 手機
  lineId: z.string().optional(),               // LINE ID
  contactMethod: z.array(z.string()),          // 聯絡方式
  contactTime: z.string().optional(),          // 聯絡時間
  source: z.array(z.string()),                 // 來源
  budget: z.string(),                          // 每人預算
  regions: z.array(z.string()),                // 想去的地區
  adults: z.number().min(0),                   // 大人數
  children: z.number().min(0),                 // 小孩數
  days: z.number().min(1),                     // 旅遊天數
  departDate: z.string().min(1),               // 出發日期
  wishlist: z.string().optional(),             // 心願清單
  note: z.string().optional(),                 // 其他需求
});

export type CarInquiryValues = z.infer<typeof CarInquirySchema>;
