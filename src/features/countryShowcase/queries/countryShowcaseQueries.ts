import { queryOptions } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { z } from 'zod';

export const countryShowcaseSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    title: z.string(),
    subtitle: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    linkText: z.string().nullable().optional(),
    linkUrl: z.string().nullable().optional(),
    order: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type CountryShowcaseEntity = z.infer<typeof countryShowcaseSchema>;

export type CountryShowcaseDTO = Omit<
    CountryShowcaseEntity,
    'id' | 'createdAt' | 'updatedAt'
>;

export const KEYS = {
    list: () => ['country-showcases'] as const,
    detail: (id: string) => ['country-showcases', id] as const,
};

export const countryShowcasesQuery = () =>
    queryOptions({
        queryKey: KEYS.list(),
        queryFn: async () => {
            const res = await axios.get('/api/admin/country-showcases');
            return countryShowcaseSchema.array().parse(res.data.data);
        },
        staleTime: 1000 * 60 * 5,
    });

export const countryShowcaseQuery = (id: string) =>
    queryOptions({
        queryKey: KEYS.detail(id),
        queryFn: async () => {
            const res = await axios.get(`/api/admin/country-showcases/${id}`);
            return countryShowcaseSchema.parse(res.data.data);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
