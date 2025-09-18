'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { testimonialsQuery } from '@/features/testimonial/queries/testimonialQueries';

export type TestimonialRow = {
    id: string | number;
    imageUrl?: string | null;
    color?: string;
} & Record<string, any>;

export function useTestimonialRows(page: number, pageSize: number) {
    const query = useQuery(testimonialsQuery(page, pageSize));

    const rows = React.useMemo<TestimonialRow[]>(
        () =>
            (query.data?.rows ?? []).map((t: any, i: number) => ({
                id: t.id ?? t._id ?? t.testimonialId ?? i + 1,
                ...t,
            })),
        [query.data?.rows]
    );

    return { ...query, rows, pagination: query.data?.pagination };
}
