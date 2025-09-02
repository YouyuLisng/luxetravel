// features/users/hooks/useUsers.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { usersQuery } from '../queries/usersQuery';

export const useUsers = () => {
    return useQuery(usersQuery());
};

export default useUsers;
