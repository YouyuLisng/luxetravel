import { z } from 'zod';

/**
 * Flight 建立用 Schema
 */
export const FlightCreateSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),

    direction: z.enum(['OUTBOUND', 'RETURN'], {
        required_error: '缺少航班方向',
    }),

    departAirport: z.string().min(1, '缺少出發機場代碼'),
    departName: z.string().min(1, '缺少出發機場名稱'),

    arriveAirport: z.string().min(1, '缺少抵達機場代碼'),
    arriveName: z.string().min(1, '缺少抵達機場名稱'),

    departTime: z.string().optional().default(''), // 例如 '08:00'
    arriveTime: z.string().optional().default(''),
    duration: z.string().optional().default(''),

    crossDay: z.boolean().optional().default(false),

    airlineCode: z.string().optional().default(''),
    airlineName: z.string().optional().default(''),
    flightNo: z.string().optional().default(''),

    isTransit: z.boolean().optional().default(false),
    remark: z.string().nullable().optional(),
});

/**
 * Flight 編輯用 Schema
 * - 因為全刪再寫，這邊其實用不到，但保留
 */
export const FlightEditSchema = FlightCreateSchema.partial();

/**
 * 對應的 TypeScript 型別
 */
export type FlightCreateValues = z.infer<typeof FlightCreateSchema>;
export type FlightEditValues = z.infer<typeof FlightEditSchema>;
