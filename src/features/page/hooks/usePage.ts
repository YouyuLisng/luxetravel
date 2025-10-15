'use client'

import { useQuery } from '@tanstack/react-query'
import { pageQuery } from '@/features/page/queries/pageQueries'

/** 取得單筆 Page */
export default function usePage(id: string, enabled = true) {
    const q = pageQuery(id)
    return useQuery({ ...q, enabled: enabled && !!id })
}
