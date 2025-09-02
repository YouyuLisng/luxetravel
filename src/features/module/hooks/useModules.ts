// features/users/hooks/useUsers.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { modulesQuery } from '../queries/modulesQuery';

export const useModules = () => {
    return useQuery(modulesQuery());
};

export default useModules;
