'use client';

import { useQuery } from '@tanstack/react-query';
import { countryShowcaseQuery } from '@/features/countryShowcase/queries/countryShowcaseQueries';

/** 取得單筆 CountryShowcase */
export default function useCountryShowcase(id: string, enabled = true) {
    const q = countryShowcaseQuery(id);
    return useQuery({ ...q, enabled: enabled && !!id });
}
