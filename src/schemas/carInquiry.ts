import { z } from 'zod';

export const CarInquirySchema = z.object({
  travelType: z.string().min(1, '旅遊形式必填'),
  contactName: z.string().min(1, '請輸入聯絡人'),
  gender: z.enum(['先生', '小姐'], { required_error: '請選擇稱謂' }),
  phone: z.string().min(5, '請輸入有效手機'),
  lineId: z.string().optional().nullable(),
  contactMethod: z.array(z.string()).min(1, '請選擇聯絡方式'),
  contactTime: z.string().min(1, '請輸入聯絡時間'),
  source: z.array(z.string()).default([]),
  budget: z.string().min(1, '請選擇預算'),
  regions: z.array(z.string()).min(1, '請選擇想去的地區'),
  adults: z.number().int().min(1, '至少 1 位大人'),
  children: z.number().int().optional().default(0),
  days: z.number().int().min(1, '請輸入旅遊天數'),
  departDate: z.string().min(1, '請輸入出發日期'),
  wishlist: z.string().max(100, '心願清單限100字').optional().nullable(),
  note: z.string().max(100, '其他需求限100字').optional().nullable(),
});

export type CarInquiryValues = z.infer<typeof CarInquirySchema>;
