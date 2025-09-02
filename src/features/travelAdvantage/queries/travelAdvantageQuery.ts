import axios from '@/lib/axios';
import { z } from 'zod';

export const travelAdvantageSchema = z.object({
    id: z.string(),
    moduleId: z.string(),
    imageUrl: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number(), 
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type TravelAdvantageEntity = z.infer<typeof travelAdvantageSchema>;

export const KEYS = {
  list: () => ['travel-advantages'] as const,
  detail: (id: string) => ['travel-advantages', id] as const,
};


export const travelAdvantagesQuery = () => ({
    queryKey: ['travel-advantages'] as const,
    queryFn: async () => {
        // 依你的 API 慣例，列表路由採用 /api/admin/advantages
        const res = await axios.get('/api/admin/advantages');
        return travelAdvantageSchema.array().parse(res.data.data);
    },
    staleTime: 1000 * 60 * 5,
});

export const travelAdvantageQuery = (id: string) => ({
    queryKey: ['travel-advantages', id] as const,
    queryFn: async () => {
        const res = await axios.get(`/api/admin/advantages/${id}`);
        return travelAdvantageSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});
