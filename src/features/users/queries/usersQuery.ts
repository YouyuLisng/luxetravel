// features/users/queries/usersQuery.ts
import axios from '@/lib/axios';
import { z } from 'zod';
const schema = z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
    image: z.string().nullable(),
    role: z.string(),
    emailVerified: z.string().nullable(),
    createdAt: z.string(),
});

export const usersQuery = () => ({
    queryKey: ['users'],
    queryFn: async () => {
        const res = await axios.get('/api/users');
        
        return schema.array().parse(res.data.users);
    },
    staleTime: 1000 * 60 * 5,
});
