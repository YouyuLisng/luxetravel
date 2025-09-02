'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
    travelArticlesQuery,
    travelArticleQuery,
    KEYS,
    type TravelArticleDTO,
} from '../queries/travelArticleQueries';

export function useTravelArticlesQuery() {
    return useQuery(travelArticlesQuery());
}

export function useTravelArticleQuery(id: string, enabled = true) {
    return useQuery({ ...travelArticleQuery(id), enabled });
}

export function useCreateTravelArticleMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: TravelArticleDTO) =>
            axios
                .post('/api/admin/article', payload)
                .then((r) => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}

export function useUpdateTravelArticleMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: TravelArticleDTO;
        }) =>
            axios
                .put(`/api/admin/article/${id}`, payload)
                .then((r) => r.data.data),
        onSuccess: (_data, { id }) => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
            qc.invalidateQueries({ queryKey: KEYS.detail(id) });
        },
    });
}

export function useDeleteTravelArticleMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            axios
                .delete(`/api/admin/article/${id}`)
                .then((r) => r.data.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KEYS.list() });
        },
    });
}
