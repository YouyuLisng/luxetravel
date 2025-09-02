'use client';

import { useQuery } from '@tanstack/react-query';
import {
  travelAdvantagesQuery,
  travelAdvantageQuery,
} from '../queries/travelAdvantageQuery';

export const useTravelAdvantagesQuery = () => useQuery(travelAdvantagesQuery());
export const useTravelAdvantageQuery = (id: string) => useQuery(travelAdvantageQuery(id));
