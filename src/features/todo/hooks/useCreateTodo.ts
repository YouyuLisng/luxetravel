import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface NewTodo {
    title: string;
}

export const useCreateTodo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newTodo: NewTodo) => {
            const response = await axios.post('/api/todos', newTodo);
            return response.data;
        },
        onSuccess: () => {
            // 新增成功後重新抓取 todos 資料
            queryClient.invalidateQueries({ queryKey: ['todos'] });
        },
    });
};
export default useCreateTodo;