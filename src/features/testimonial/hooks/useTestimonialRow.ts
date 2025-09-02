// src/features/testimonial/hooks/useTestimonialRow.ts
'use client';

import * as React from 'react';
import { useTestimonialsQuery } from './useTestimonial';

export type TestimonialRow = { id: string | number } & Record<string, any>;

export function useTestimonialRows() {
    const query = useTestimonialsQuery();

    const rows = React.useMemo<TestimonialRow[]>(
        () =>
            (query.data ?? []).map((t: any, i: number) => ({
                id: t.id ?? t._id ?? t.testimonialId ?? i + 1,
                ...t,
            })),
        [query.data]
    );

    return { ...query, rows };
}
