// features/todos/queries/todosQuery.ts
import axios from '@/lib/axios';

export const todosQuery = () => ({
    queryKey: ['todos'],
    queryFn: async () => {
        const res = await axios.get('/api/todos');
        return res.data;
    },
});
