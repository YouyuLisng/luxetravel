import { z } from 'zod';

/** 共用欄位 */
const baseFields = {
    productId: z.string().min(1, '請選擇所屬產品'),
    code: z.string().min(1, '請輸入梯次代碼'),
    departDate: z.coerce.date({ required_error: '請選擇出發日期' }),
    returnDate: z.coerce.date({ required_error: '請選擇回程日期' }),
    adult: z.coerce.number().int().min(0, '大人人數不可小於 0'),
    childWithBed: z.coerce.number().int().min(0, '佔床兒童人數不可小於 0'),
    childNoBed: z.coerce.number().int().min(0, '不佔床兒童人數不可小於 0'),
    infant: z.coerce.number().int().min(0, '嬰兒人數不可小於 0'),
    deposit: z.string().optional().nullable(),
    status: z.coerce.number().int().default(0),
    note: z.string().optional().nullable(),
    arrangement: z.string().optional().nullable(), // 👈 改正
};

/** 建立用 schema */
export const ToursCreateSchema = z.object({
    ...baseFields,
});

/** 編輯用 schema（允許部分欄位可省略） */
export const ToursEditSchema = z.object({
    productId: baseFields.productId.optional(),
    code: baseFields.code.optional(),
    departDate: baseFields.departDate.optional(),
    returnDate: baseFields.returnDate.optional(),
    adult: baseFields.adult.optional(),
    childWithBed: baseFields.childWithBed.optional(),
    childNoBed: baseFields.childNoBed.optional(),
    infant: baseFields.infant.optional(),
    deposit: baseFields.deposit,
    status: baseFields.status.optional(),
    note: baseFields.note,
    arrangement: baseFields.arrangement, // 👈 改正
});

/** 匯出型別 */
export type ToursCreateValues = z.infer<typeof ToursCreateSchema>;
export type ToursEditValues = z.infer<typeof ToursEditSchema>;
