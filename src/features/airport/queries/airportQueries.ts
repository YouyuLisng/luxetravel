// features/airport/queries/airportQueries.ts
import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

/* ---------------- Zod Schemas ---------------- */

// 地區/國家（列表顯示用的精簡型）
export const regionLiteSchema = z.object({
    id: z.string(),
    code: z.string(),
    nameZh: z.string(),
    nameEn: z.string(),
    imageUrl: z.string().nullable().optional(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const countryLiteSchema = regionLiteSchema;

// 建立/更新用 DTO
export const airportDTOSchema = z.object({
    code: z.string(),
    nameEn: z.string(),
    nameZh: z.string(),
    regionId: z.string(),
    countryId: z.string(),
    imageUrl: z.string().nullable().optional(),
    enabled: z.boolean().optional(),
});

// 後端回傳的完整實體（可含關聯）
export const airportEntitySchema = airportDTOSchema.extend({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    region: regionLiteSchema.optional(), // <- include region
    country: countryLiteSchema.optional(), // <- include country
});

const paginationSchema = z.object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    pageCount: z.number().int().min(1),
});

/* ---------------- Types ---------------- */
export type AirportDTO = z.infer<typeof airportDTOSchema>;
export type AirportEntity = z.infer<typeof airportEntitySchema>;
export type AirportListResponse = {
    data: AirportEntity[];
    pagination: z.infer<typeof paginationSchema>;
};

/* ---------------- API base & KEYS ---------------- */
const BASE = '/api/admin/airports' as const;

export const KEYS = {
    list: (params?: Record<string, any>) => ['airports', params ?? {}] as const,
    detail: (id: string) => ['airports', id] as const,
};

/* ---------------- 小工具：統一解析 {status,message,data} ---------------- */
function parsePayload<T = unknown>(res: any): T {
    const payload = res?.data;
    if (!payload?.status) {
        throw new Error(payload?.message || 'Request failed');
    }
    return payload.data as T;
}

/* ---------------- REST: CRUD ---------------- */

export async function createAirport(
    payload: AirportDTO
): Promise<AirportEntity> {
    const res = await axios.post(BASE, payload);
    const raw = parsePayload<unknown>(res);
    return airportEntitySchema.parse(raw);
}

export async function updateAirport(
    id: string,
    payload: AirportDTO // 若要允許部分更新可改成 Partial<AirportDTO>
): Promise<AirportEntity> {
    const res = await axios.put(`${BASE}/${id}`, payload);
    const raw = parsePayload<unknown>(res);
    return airportEntitySchema.parse(raw);
}

export async function deleteAirport(id: string): Promise<{ id: string }> {
    const res = await axios.delete(`${BASE}/${id}`);
    const raw = parsePayload<unknown>(res);
    // 後端若回整個 entity 或只回 id 都能處理
    const parsed = airportEntitySchema.partial().parse(raw ?? {});
    return { id: parsed.id ?? id };
}

/* ---------------- React Query: Query Options ---------------- */

// 列表（含分頁；如不需要分頁參數可不傳）
export const airportsQuery = (params?: { page?: number; pageSize?: number }) =>
    queryOptions({
        queryKey: KEYS.list(params),
        queryFn: async (): Promise<AirportListResponse> => {
            const res = await axios.get(BASE, { params });
            // 後端包 { status, data, pagination }
            const payload = res.data;
            if (!payload?.status)
                throw new Error(payload?.message || 'Request failed');
            const data = z.array(airportEntitySchema).parse(payload.data);
            const pagination = paginationSchema.parse(payload.pagination);
            return { data, pagination };
        },
        staleTime: 1000 * 60 * 5,
    });

export const airportQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: async (): Promise<AirportEntity> => {
            const res = await axios.get(`${BASE}/${id}`);
            const entity = parsePayload<unknown>(res);
            return airportEntitySchema.parse(entity);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });

/* ---------------- 如仍需要「只拿陣列」的 util ---------------- */
export async function getAirportsOnly(): Promise<AirportEntity[]> {
    const res = await axios.get(BASE);
    const payload = res.data;
    if (!payload?.status) throw new Error(payload?.message || 'Request failed');
    return z.array(airportEntitySchema).parse(payload.data);
}
