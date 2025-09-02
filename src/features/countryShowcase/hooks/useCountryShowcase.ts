'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    countryShowcasesQuery,
    countryShowcaseQuery,
    KEYS,
    type CountryShowcaseDTO,
    type CountryShowcaseEntity,
} from '../queries/countryShowcaseQueries';
import axios from '@/lib/axios';

export function useCountryShowcasesQuery() {
    return useQuery(countryShowcasesQuery());
}

export function useCountryShowcaseQuery(id: string, enabled = true) {
    return useQuery({ ...countryShowcaseQuery(id), enabled });
}

export function useCreateCountryShowcaseMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CountryShowcaseDTO) =>
            axios
                .post('/api/admin/country-showcases', payload)
                .then((res) => res.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}

export function useUpdateCountryShowcaseMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: CountryShowcaseDTO;
        }) =>
            axios
                .put(`/api/admin/country-showcases/${id}`, payload)
                .then((res) => res.data.data),
        onSuccess: (_, { id }) => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
            qc.invalidateQueries({ queryKey: KEYS.detail(id) });
        },
    });
}

export function useDeleteCountryShowcaseMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            axios
                .delete(`/api/admin/country-showcases/${id}`)
                .then((res) => res.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}
