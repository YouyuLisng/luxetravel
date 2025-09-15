'use client';

import * as React from 'react';
import { useTestimonialsQuery } from './useTestimonial';

export type TestimonialRow = {
    id: string | number;
    imageUrl?: string | null;
    color?: string;
} & Record<string, any>;

export function useTestimonialRows() {
    const query = useTestimonialsQuery();

    const rows = React.useMemo<TestimonialRow[]>(
        () =>
            (query.data ?? []).map((t: any, i: number) => ({
                id: t.id ?? t._id ?? t.testimonialId ?? i + 1,
                ...t, // ⬅️ 包含 imageUrl / color / 其他欄位
            })),
        [query.data]
    );

    return { ...query, rows };
}
