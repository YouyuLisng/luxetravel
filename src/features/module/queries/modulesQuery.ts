// features/modules/queries/modulesQuery.ts
import axios from '@/lib/axios';
import { z } from 'zod';

export const moduleSchema = z.object({
    id: z.string(),
    key: z.string(),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    type: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type ModuleEntity = z.infer<typeof moduleSchema>;

export const modulesQuery = () => ({
    queryKey: ['modules'] as const,
    queryFn: async () => {
        const res = await axios.get('/api/admin/modules');
        return moduleSchema.array().parse(res.data.data);
    },
    staleTime: 1000 * 60 * 5,
});

export const moduleQuery = (id: string) => ({
    queryKey: ['modules', id] as const,
    queryFn: async () => {
        const res = await axios.get(`/api/admin/modules/${id}`);
        return moduleSchema.parse(res.data.data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
});
