// features/todos/hooks/useTodos.ts
import { useQuery } from '@tanstack/react-query';
import { todosQuery } from '../queries/todosQuery';

export const useTodos = () => {
    return useQuery(todosQuery());
};

export default useTodos;