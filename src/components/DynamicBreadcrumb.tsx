// components/ui/dynamic-breadcrumb.tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buildBreadcrumbs } from '@/config/breadcrumb.config';
import { sidebarItems } from '@/config/sidebar.config';

type Crumb = { label: string; href?: string | null };

export const DynamicBreadcrumb = () => {
    const pathname = usePathname();

    // 1) 依規則把 /new、/[id] 轉成「新增/編輯 + 中文資源名」
    const baseCrumbs = useMemo<Crumb[]>(
        () => buildBreadcrumbs(pathname),
        [pathname]
    );

    // 2) 依側邊欄設定在「/admin/{第二段}」之間插入群組名稱（例如：行程管理）
    const crumbs = useMemo<Crumb[]>(() => {
        const segs = pathname
            .replace(/^\/|\/$/g, '')
            .split('/')
            .filter(Boolean);
        if (segs[0] !== 'admin' || segs.length < 2) return baseCrumbs;

        const baseHref = '/' + segs.slice(0, 2).join('/'); // /admin/{resource}
        const group = sidebarItems.find((g) =>
            (g.items ?? []).some((it) => it.url === baseHref)
        );
        if (!group) return baseCrumbs;

        const next = [...baseCrumbs];
        // 插在「管理後台」後面，避免重覆插入
        if (next[1]?.label !== group.title) {
            next.splice(1, 0, { label: group.title, href: null });
        }
        return next;
    }, [pathname, baseCrumbs]);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {crumbs.map((c, idx) => {
                    const isLast = idx === crumbs.length - 1;
                    const showSep = idx > 0;
                    return (
                        <React.Fragment key={(c.href ?? c.label) + '-' + idx}>
                            {showSep && <BreadcrumbSeparator />}
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                                ) : c.href ? (
                                    <BreadcrumbLink asChild>
                                        <Link href={c.href}>{c.label}</Link>
                                    </BreadcrumbLink>
                                ) : (
                                    <span className="text-muted-foreground">
                                        {c.label}
                                    </span>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};
