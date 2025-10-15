// src/lib/breadcrumb.ts
import { breadcrumbMap } from '@/config/breadcrumb.config';

export type Crumb = { href: string; label: string };

export function buildBreadcrumbs(pathname: string): Crumb[] {
    // e.g. "/admin/travelarticle/new" -> ["admin","travelarticle","new"]
    const parts = pathname
        .replace(/^\/|\/$/g, '')
        .split('/')
        .filter(Boolean);

    const crumbs: Crumb[] = [];
    let acc = '';

    for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;

        // 1) 先用「累積路徑」找（可命中 travelarticle/new）
        // 2) 再退回用單段 key 找（可命中 travelarticle）
        // 3) 都沒有就顯示原字
        const label =
            breadcrumbMap[acc] ??
            breadcrumbMap[part] ??
            decodeURIComponent(part);

        crumbs.push({ href: `/${acc}`, label });
    }

    return crumbs;
}
