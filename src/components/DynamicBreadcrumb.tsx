// components/ui/dynamic-breadcrumb.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
    const [itemName, setItemName] = useState<string | null>(null);

    /** STEP 1：依規則產生基本麵包屑 */
    const baseCrumbs = useMemo<Crumb[]>(() => buildBreadcrumbs(pathname), [pathname]);

    /** STEP 2：如果是 wizard 編輯頁面，呼叫 API 取得項目名稱 */
    useEffect(() => {
        const match = pathname.match(/\/admin\/product\/([^/]+)\/wizard\/([^/]+)/);
        if (match) {
            const id = match[1];
            fetch(`/api/admin/product/${id}`)
                .then((res) => res.json())
                .then((json) => {
                    const data = json?.data ?? json;
                    // 組合名稱：「namePrefix + name」
                    const fullName =
                        data?.namePrefix && data?.name
                            ? `${data.namePrefix} ${data.name}`
                            : data?.name ?? data?.namePrefix ?? null;
                    setItemName(fullName);
                })
                .catch(() => setItemName(null));
        } else {
            setItemName(null);
        }
    }, [pathname]);

    /** STEP 3：插入側邊欄群組名稱（例如「行程管理」） */
    const crumbs = useMemo<Crumb[]>(() => {
        const segs = pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
        if (segs[0] !== 'admin' || segs.length < 2) return baseCrumbs;

        const baseHref = '/' + segs.slice(0, 2).join('/');
        const group = sidebarItems.find((g) =>
            (g.items ?? []).some((it) => it.url === baseHref)
        );
        if (!group) return baseCrumbs;

        const next = [...baseCrumbs];
        if (next[1]?.label !== group.title) {
            next.splice(1, 0, { label: group.title, href: null });
        }
        return next;
    }, [pathname, baseCrumbs]);

    /** STEP 4：若是編輯頁面且有名稱，在最後加上 (名稱) */
    const finalCrumbs = useMemo(() => {
        if (!itemName) return crumbs;
        const next = [...crumbs];
        const last = next[next.length - 1];
        if (last.label.startsWith('編輯')) {
            next[next.length - 1] = {
                ...last,
                label: `${last.label}（${itemName}）`,
            };
        }
        return next;
    }, [crumbs, itemName]);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {finalCrumbs.map((c, idx) => {
                    const isLast = idx === finalCrumbs.length - 1;
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
                                    <span className="text-muted-foreground">{c.label}</span>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};
