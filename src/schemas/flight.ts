import { z } from 'zod';

export const FlightCreateSchema = z.object({
    productId: z.string().min(1, '缺少產品 ID'),
    direction: z.enum(['OUTBOUND', 'RETURN']),
    day: z.number().int().min(1).optional().nullable(),
    departAirport: z.string().min(1, '缺少出發機場代碼'),
    departName: z.string().min(1, '缺少出發機場名稱'),
    arriveAirport: z.string().min(1, '缺少抵達機場代碼'),
    arriveName: z.string().min(1, '缺少抵達機場名稱'),
    departTime: z.string().optional().default(''),
    arriveTime: z.string().optional().default(''),
    duration: z.string().optional().default(''),
    crossDay: z.boolean().optional().default(false),
    airlineCode: z.string().optional().default(''),
    airlineName: z.string().optional().default(''),
    flightNo: z.string().optional().default(''),
    isTransit: z.boolean().optional().default(false),
    remark: z.string().nullable().optional(),
});

export const FlightFormSchema = z.object({
    flights: z
        .array(FlightCreateSchema)
        .min(2, '至少需要一筆去程與一筆回程航班'),
});

export type FlightCreateValues = z.infer<typeof FlightCreateSchema>;
export type FlightFormValues = z.infer<typeof FlightFormSchema>;
// { flights: FlightCreateValues[] }
