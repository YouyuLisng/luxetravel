'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    IconCircleCheckFilled,
    IconDotsVertical,
    IconGripVertical,
    IconLayoutColumns,
    IconLoader,
    IconPlus,
} from '@tabler/icons-react';
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { z } from 'zod';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { IconSearch } from '@tabler/icons-react';
/* ========================= Schema ========================= */
export const schema = z.object({
    id: z.union([z.string(), z.number()]),
    header: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    target: z.string().optional(),
    limit: z.string().optional(),
    reviewer: z.string().optional(),
});

/* ========================= Helpers ========================= */
type ColumnLabels = Record<string, React.ReactNode>;

function startCase(key: string) {
    const spaced = key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
function labelOf(
    key: string,
    labels?: ColumnLabels,
    fallback?: React.ReactNode
) {
    return labels?.[key] ?? fallback ?? startCase(key);
}

/** countries 欄位（可能是字串陣列或物件陣列）轉 badge 文本 */
function toCountryLabels(input: any): string[] {
    if (!input) return [];
    const arr = Array.isArray(input)
        ? input
        : typeof input === 'string'
          ? input.split(',')
          : [];
    const labels = arr
        .map((c: any) => {
            if (typeof c === 'string') return c.trim();
            if (!c || typeof c !== 'object') return '';
            return String(c.nameZh ?? c.nameEn ?? c.code ?? c.id ?? '').trim();
        })
        .filter(Boolean);
    return Array.from(new Set(labels));
}

function formatDateTime(
    value: unknown,
    locale: string = 'zh-TW',
    opts?: Intl.DateTimeFormatOptions
) {
    if (!value) return '—';
    const d = new Date(value as any);
    if (Number.isNaN(d.getTime())) return String(value);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        ...opts,
    };
    return new Intl.DateTimeFormat(locale, options).format(d);
}

/** region / country 物件轉顯示文本 */
function rcLabel(input: any): string {
    if (!input || typeof input !== 'object') return '';
    return String(
        input.nameZh ?? input.nameEn ?? input.code ?? input.id ?? ''
    ).trim();
}

/* 使用者類型 + AvatarCell + 取得姓名縮寫 */
type UserEntity = {
    id: string | number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified?: string | Date | null;
} & Record<string, any>;

function getInitials(name?: string | null, email?: string | null) {
    const n = (name || '').trim();
    if (n) {
        const parts = n.split(/\s+/).filter(Boolean);
        const take =
            (parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '');
        return take.toUpperCase();
    }
    const e = (email || '').trim();
    if (e) return e.replace(/@.*/, '').slice(0, 2).toUpperCase();
    return '??';
}

function AvatarCell({ user }: { user: UserEntity }) {
    const initials = getInitials(user.name, user.email);
    return (
        <div className="flex items-center gap-3">
            {user.image ? (
                <Image
                    alt={user.name || user.email || 'avatar'}
                    className="rounded-full object-cover"
                    height={40}
                    width={40}
                    src={user.image}
                />
            ) : (
                <div className="size-10 rounded-full bg-muted text-muted-foreground grid place-items-center text-sm font-medium">
                    {initials}
                </div>
            )}
            <div className="flex flex-col">
                <span className="font-medium leading-5">
                    {user.name || '—'}
                </span>
                <span className="text-xs text-muted-foreground">
                    {user.email ? (
                        <a
                            href={`mailto:${user.email}`}
                            className="underline underline-offset-2"
                        >
                            {user.email}
                        </a>
                    ) : (
                        '—'
                    )}
                </span>
            </div>
        </div>
    );
}

/* ========================= 內建 Confirm Dialog ========================= */
function ConfirmDeleteDialog({
    open,
    onOpenChange,
    loading,
    onConfirm,
    title = '確定要刪除嗎？',
    description = '此操作無法復原，將永久刪除資料。',
    confirmText = '刪除',
    cancelText = '取消',
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    loading: boolean;
    onConfirm: () => Promise<void> | void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
}) {
    return (
        <AlertDialog
            open={open}
            onOpenChange={(o) => (!loading ? onOpenChange(o) : undefined)}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description ? (
                        <AlertDialogDescription>
                            {description}
                        </AlertDialogDescription>
                    ) : null}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-600 hover:bg-red-600/90 focus:ring-red-600"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                處理中…
                            </span>
                        ) : (
                            confirmText
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/* ========================= Drag Handle（不呼叫 useSortable） ========================= */
function DragHandle({
    attributes,
    listeners,
}: {
    attributes: React.HTMLAttributes<any>;
    listeners?: any;
}) {
    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-7 hover:bg-transparent"
        >
            <IconGripVertical className="text-muted-foreground size-3" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    );
}

/* ========================= Columns Generator ========================= */
type GenerateOpts = {
    visibleKeys?: string[];
    columnLabels?: ColumnLabels;
    onDeleteClick?: (id: string) => void;
    getEditHref?: (id: string | number) => string;
    enableDrag?: boolean;
    onToggleFeatured?: (id: string, featured: boolean) => void;
};

function generateColumns<T extends Record<string, any>>(
    data: T[],
    opts?: GenerateOpts
): ColumnDef<T>[] {
    const enableDrag = !!opts?.enableDrag;

    if (!data?.length) {
        return [
            ...(enableDrag
                ? [
                      {
                          id: 'drag',
                          header: () => null,
                          cell: () => null,
                      } as ColumnDef<T>,
                  ]
                : []),
            {
                id: 'actions',
                header: () => opts?.columnLabels?.actions ?? 'Actions',
                cell: () => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                            >
                                <IconDotsVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem>編輯</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                刪除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ];
    }

    const first = data[0];
    const rawKeys = Object.keys(first).filter((k) => k !== 'id');
    const keys = opts?.visibleKeys
        ? opts.visibleKeys.filter((k) => rawKeys.includes(k))
        : rawKeys;
    const L = (key: string, fallback?: React.ReactNode) =>
        labelOf(key, opts?.columnLabels, fallback);

    const generated: ColumnDef<T>[] = [];

    // 只有啟用時才渲染拖曳欄
    if (enableDrag)
        generated.push({ id: 'drag', header: () => null, cell: () => null });

    // 判斷是不是 TourProduct
    const isTourProduct = 'code' in first && 'days' in first;

    for (const key of keys) {
        // ===== TourProduct 專屬欄位 =====
        if (isTourProduct) {
            if (key === 'code') {
                generated.push({
                    accessorKey: key,
                    header: () => L(key, '產品代碼'),
                    cell: ({ row }) => (
                        <span className="font-mono">
                            {(row.original as any)[key]}
                        </span>
                    ),
                } as ColumnDef<T>);
                continue;
            }
            if (key === 'category') {
                const categoryMap: Record<string, string> = {
                    GROUP: '團體',
                    FIT: '自由行',
                    SKI: '滑雪',
                    CRUISE: '郵輪',
                    OTHER: '其他',
                };

                generated.push({
                    accessorKey: key,
                    header: () => L(key, '產品類型'),
                    cell: ({ row }) => {
                        const raw = (row.original as any)[key];
                        return (
                            <span className="font-mono">
                                {categoryMap[raw] ?? raw ?? '—'}
                            </span>
                        );
                    },
                } as ColumnDef<T>);
                continue;
            }
            if (key === 'arriveCountry') {
                generated.push({
                    accessorKey: key,
                    header: () => L(key, '目的地國家'),
                    cell: ({ row }) => {
                        const raw = (row.original as any)[key];

                        let label: string;
                        if (!raw) {
                            label = '—';
                        } else if (typeof raw === 'object') {
                            label =
                                raw.nameZh ||
                                raw.nameEn ||
                                raw.code ||
                                raw.id ||
                                JSON.stringify(raw);
                        } else {
                            label = String(raw);
                        }

                        return (
                            <Badge variant="outline" className="px-1.5">
                                {label}
                            </Badge>
                        );
                    },
                } as ColumnDef<T>);
                continue;
            }

            if (key === 'status') {
                const statusMap: Record<string | number, string> = {
                    0: '草稿',
                    1: '上架',
                    2: '下架',
                };

                generated.push({
                    accessorKey: key,
                    header: () => L(key, '狀態'),
                    cell: ({ row }) => {
                        const raw = (row.original as any)[key];
                        const label = statusMap[raw] ?? String(raw ?? '—');

                        return (
                            <Badge
                                variant={
                                    raw === 2 ? 'destructive' : 'secondary'
                                } // 只用既有 variant
                                className={
                                    raw === 1
                                        ? 'bg-green-500 text-white hover:bg-green-600' // 上架 → 綠色
                                        : ''
                                }
                            >
                                {label}
                            </Badge>
                        );
                    },
                } as ColumnDef<T>);
                continue;
            }
            if (key === 'name') {
                generated.push({
                    accessorKey: key,
                    header: () => L(key, '產品名稱'),
                    cell: ({ row }) => (
                        <span>{(row.original as any)[key]}</span>
                    ),
                } as ColumnDef<T>);
                continue;
            }
            if (key === 'departCityCode' || key === 'arriveCityCode') {
                generated.push({
                    accessorKey: key,
                    header: () =>
                        L(
                            key,
                            key === 'departCityCode' ? '出發城市' : '抵達城市'
                        ),
                    cell: ({ row }) => (
                        <Badge variant="outline" className="px-1.5">
                            {(row.original as any)[key] || '—'}
                        </Badge>
                    ),
                } as ColumnDef<T>);
                continue;
            }
            if (key === 'departAirport' || key === 'arriveAirport') {
                generated.push({
                    accessorKey: key,
                    header: () =>
                        L(
                            key,
                            key === 'departAirport' ? '出發機場' : '抵達機場'
                        ),
                    cell: ({ row }) => (
                        <span>{(row.original as any)[key] || '—'}</span>
                    ),
                } as ColumnDef<T>);
                continue;
            }
            if (key === 'isFeatured') {
                generated.push({
                    accessorKey: key,
                    header: () => L(key, '精選'),
                    cell: ({ row }) => {
                        const id = String((row.original as any).id);
                        const raw = (row.original as any).isFeatured ?? false;

                        return (
                            <Switch
                                checked={Boolean(raw)}
                                onCheckedChange={(checked) => {
                                    // 這邊呼叫 DataTable 傳下來的更新函式
                                    opts?.onToggleFeatured?.(id, checked);
                                }}
                            />
                        );
                    },
                } as ColumnDef<T>);
                continue;
            }
        }

        // ===== 原本的邏輯 =====

        if (key === 'name' || key === 'fullName' || key === 'username') {
            generated.push({
                accessorKey: key,
                header: () => L('name', '使用者'),
                enableSorting: true,
                cell: ({ row }) => (
                    <AvatarCell user={row.original as unknown as UserEntity} />
                ),
            } as ColumnDef<T>);
            continue;
        }

        if (
            key === 'country' ||
            key === 'region' ||
            key === 'category' ||
            key === 'categoryName' ||
            key === 'city' ||
            key === 'arriveCountry'
        ) {
            generated.push({
                accessorKey: key,
                header: () =>
                    L(
                        key,
                        key === 'country'
                            ? '國家'
                            : key === 'region'
                              ? '地區'
                              : '分類'
                    ),
                cell: ({ row }) => {
                    const raw = (row.original as any)[key];

                    // ✅ 如果是物件 → 顯示它的 nameZh 或 nameEn
                    let label: string;
                    if (!raw) {
                        label = '—';
                    } else if (typeof raw === 'object') {
                        // 針對 category 特別處理
                        label =
                            raw.nameZh ||
                            raw.nameEn ||
                            raw.code ||
                            raw.id ||
                            JSON.stringify(raw);
                    } else {
                        label = String(raw);
                    }

                    return (
                        <Badge variant="outline" className="px-1.5">
                            {label}
                        </Badge>
                    );
                },
            } as ColumnDef<T>);
            continue;
        }

        if (key === 'enabled') {
            generated.push({
                accessorKey: key,
                header: () => L(key, '啟用'),
                cell: ({ row }) => {
                    const value = Boolean((row.original as any)[key]);
                    return <Switch checked={value} />;
                },
            } as ColumnDef<T>);
            continue;
        }

        if (key === 'emailVerified') {
            generated.push({
                accessorKey: key,
                header: () => L(key, '信箱驗證'),
                enableSorting: false,
                cell: ({ row }) => {
                    const v = (row.original as any)[key];
                    const verified = !!v;
                    return (
                        <Badge
                            variant="outline"
                            className="text-muted-foreground px-1.5"
                        >
                            {verified ? (
                                <span className="flex items-center gap-1">
                                    <IconCircleCheckFilled className="size-4 text-green-500" />
                                    已驗證
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <IconLoader className="size-4 animate-spin text-yellow-500" />
                                    未驗證
                                </span>
                            )}
                        </Badge>
                    );
                },
            } as ColumnDef<T>);
            continue;
        }
        if (key === 'content' || key === 'description' || key === 'seoDesc') {
            generated.push({
                accessorKey: key,
                header: () => L(key, '內容'),
                cell: ({ row }) => (
                    <span className="max-w-[600px] line-clamp-2">
                        {String((row.original as any)[key] ?? '')}
                    </span>
                ),
            } as ColumnDef<T>);
            continue;
        }

        if (
            key === 'countries' ||
            key === 'role' ||
            key === 'tags' ||
            key === 'keywords'
        ) {
            generated.push({
                accessorKey: key,
                header: () =>
                    L(
                        key,
                        key === 'tags'
                            ? 'Tags'
                            : key === 'countries'
                              ? 'Countries'
                              : 'Role'
                    ),
                enableSorting: false,
                cell: ({ row }) => {
                    const labels = toCountryLabels((row.original as any)[key]);
                    if (!labels.length)
                        return <span className="text-muted-foreground">—</span>;
                    const max = 5;
                    const shown = labels.slice(0, max);
                    const rest = labels.length - shown.length;
                    return (
                        <div className="flex max-w-[360px] flex-wrap gap-1">
                            {shown.map((txt) => (
                                <Badge
                                    key={txt}
                                    variant="outline"
                                    className="px-1.5"
                                >
                                    {txt}
                                </Badge>
                            ))}
                            {rest > 0 && (
                                <Badge variant="secondary" className="px-1.5">
                                    +{rest}
                                </Badge>
                            )}
                        </div>
                    );
                },
            } as ColumnDef<T>);
            continue;
        }

        if (key === 'mode') {
            generated.push({
                accessorKey: key,
                header: () => L(key, 'Mode'),
                enableSorting: false,
                cell: ({ row }) => {
                    const value = (row.original as any)[key];
                    if (value === 'REAL') {
                        return (
                            <Badge variant="outline" className="px-1.5">
                                評論
                            </Badge>
                        );
                    }
                    if (value === 'MARKETING') {
                        return (
                            <Badge variant="outline" className="px-1.5">
                                行銷
                            </Badge>
                        );
                    }
                    return <span className="text-muted-foreground">—</span>;
                },
            } as ColumnDef<T>);
            continue;
        }

        const LINK_KEYS = ['linkUrl', 'url', 'href', 'website', 'link'];
        if (LINK_KEYS.includes(key)) {
            generated.push({
                accessorKey: key,
                header: () => L(key, 'Link'),
                cell: ({ row }) => {
                    const raw = (row.original as any)[key];
                    const href =
                        typeof raw === 'string' && raw.trim() ? raw : '/';
                    const isExternal = /^https?:\/\//i.test(href);
                    return (
                        <Link
                            href={href}
                            target={isExternal ? '_blank' : undefined}
                            rel={isExternal ? 'noopener noreferrer' : undefined}
                            className="text-primary underline underline-offset-4 hover:no-underline break-all"
                        >
                            {typeof raw === 'string' && raw.trim() ? raw : '/'}
                        </Link>
                    );
                },
            } as ColumnDef<T>);
            continue;
        }

        const IMAGE_KEYS = [
            'imageUrl',
            'seoImage',
            'image',
            'thumbnail',
            'thumbUrl',
            'cover',
            'coverUrl',
            'banner',
            'bannerUrl',
            'photo',
            'picture',
            'bookImage',
            'landscapeImage',
        ];

        if (IMAGE_KEYS.includes(key)) {
            generated.push({
                accessorKey: key,
                header: () => L(key, '圖片'),
                enableSorting: false,
                cell: ({ row }) => {
                    const src = String((row.original as any)[key] ?? '');
                    const alt = String((row.original as any).title ?? 'Image');
                    const isBookImage = key === 'bookImage';

                    return src ? (
                        <div
                            className={`
            relative w-[120px] h-[100px] rounded-md border overflow-hidden
            flex items-center justify-center
            ${isBookImage ? 'bg-[#2d2d2d]' : 'bg-[#f9f9f9]'}
          `}
                        >
                            {isBookImage ? (
                                // ✅ 專屬 bookImage：用非 fill 模式 + auto 寬高比例
                                <img
                                    src={src}
                                    alt={alt}
                                    className="
                max-w-full max-h-full object-contain 
                drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]
              "
                                />
                            ) : (
                                // 其他類型圖片維持裁切 cover 風格
                                <Image
                                    alt={alt}
                                    src={src}
                                    width={120}
                                    height={100}
                                    className="object-cover"
                                />
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    );
                },
            } as ColumnDef<T>);
            continue;
        }

        if (key === 'createdAt' || key === 'updatedAt') {
            generated.push({
                accessorKey: key,
                header: () => L(key, startCase(key)),
                enableSorting: true,
                cell: ({ row }) => {
                    const raw = (row.original as any)[key];
                    return (
                        <span className="tabular-nums">
                            {formatDateTime(raw, 'zh-TW')}
                        </span>
                    );
                },
            } as ColumnDef<T>);
            continue;
        }

        // fallback
        generated.push({
            accessorKey: key,
            header: () => L(key),
            cell: ({ row }) => (
                <span>{String((row.original as any)[key] ?? '')}</span>
            ),
        } as ColumnDef<T>);
    }

    // Actions
    generated.push({
        id: 'actions',
        header: () => opts?.columnLabels?.actions ?? 'Actions',
        cell: ({ row }) => {
            const id = (row.original as any).id;
            const editHref = opts?.getEditHref?.(id);

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                        >
                            <IconDotsVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        {editHref ? (
                            <DropdownMenuItem asChild>
                                <Link
                                    href={editHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    編輯
                                </Link>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem disabled>編輯</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => opts?.onDeleteClick?.(String(id))}
                        >
                            刪除
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
        enableSorting: false,
    });

    return generated;
}

/* ========================= Draggable Row（唯一 useSortable） ========================= */
function DraggableRow({ row }: { row: Row<any> }) {
    const {
        attributes,
        listeners,
        transform,
        transition,
        setNodeRef,
        isDragging,
    } = useSortable({
        id: String((row.original as any).id),
    });

    return (
        <TableRow
            data-state={row.getIsSelected() && 'selected'}
            data-dragging={isDragging}
            ref={setNodeRef}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={{ transform: CSS.Transform.toString(transform), transition }}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {cell.column.id === 'drag' ? (
                        <DragHandle
                            attributes={attributes}
                            listeners={listeners}
                        />
                    ) : (
                        flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                        )
                    )}
                </TableCell>
            ))}
        </TableRow>
    );
}

/* 非拖曳版本 Row */
function PlainRow({ row }: { row: Row<any> }) {
    return (
        <TableRow data-state={row.getIsSelected() && 'selected'}>
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );
}

/* ========================= DataTable（無 Tabs 版） ========================= */
export function DataTable({
    data: initialData,
    visibleKeys,
    columnLabels,
    onDelete,
    onReorder,
    onRefresh,
    getEditHref,
    currentQuery = '',
    addButtonLabel = '新增',
    addButtonHref = '/admin/new',
    pagination: serverPagination,
    onPageChange,
    onPageSizeChange,
    searchValue = '',
    onSearch,
    onToggleFeatured,
}: {
    data: Array<Record<string, any>>;
    visibleKeys?: string[];
    columnLabels?: ColumnLabels;
    onDelete?: (id: string) => Promise<any>;
    onReorder?: (ids: string[]) => Promise<any>;
    onRefresh?: () => Promise<any> | void;
    getEditHref?: (id: string | number) => string;
    currentQuery?: string;
    addButtonLabel?: string;
    addButtonHref?: string;
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        pageCount: number;
    };
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    searchValue?: string;
    onSearch?: (keyword: string) => void;
    onToggleFeatured?: (id: string, featured: boolean) => Promise<any>;
}) {
    const [data, setData] = React.useState(() => initialData);
    React.useEffect(() => setData(initialData), [initialData]);
    const { toast } = useToast();

    // ✅ 是否啟用拖曳：資料含有 order，且（若指定）visibleKeys 也包含 order
    const enableDrag = React.useMemo(() => {
        const orderInData = data?.some((r) =>
            Object.prototype.hasOwnProperty.call(r, 'order')
        );
        const orderInVisible = !visibleKeys || visibleKeys.includes('order');
        return !!orderInData && !!orderInVisible;
    }, [data, visibleKeys]);
    const handleToggleFeatured = async (id: string, featured: boolean) => {
        // 先更新本地 state，讓 UI 即時切換
        setData((prev) =>
            prev.map((item) =>
                String(item.id) === id
                    ? { ...item, isFeatured: featured }
                    : item
            )
        );

        if (onToggleFeatured) {
            try {
                await onToggleFeatured(id, featured);
                toast({
                    variant: 'success',
                    title: '操作完成',
                    description: featured ? '已設為精選' : '已取消精選',
                });
            } catch (e: any) {
                // 如果後端失敗，還原回原本的值
                setData((prev) =>
                    prev.map((item) =>
                        String(item.id) === id
                            ? { ...item, isFeatured: !featured }
                            : item
                    )
                );
                toast({
                    variant: 'destructive',
                    title: '更新失敗',
                    description: e?.message ?? '',
                });
            }
        }
    };

    // 刪除 Dialog 狀態
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const [deleting, setDeleting] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<string | null>(null);

    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [search, setSearch] = React.useState(searchValue);
    React.useEffect(() => {
        setSearch(searchValue);
    }, [searchValue]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') onSearch?.(search);
    };

    const handleSearchClick = () => {
        onSearch?.(search);
    };

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    );

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () => (enableDrag ? data?.map(({ id }) => String(id)) || [] : []),
        [data, enableDrag]
    );

    const columns = React.useMemo(
        () =>
            generateColumns(data, {
                visibleKeys,
                columnLabels,
                getEditHref: (id) => {
                    const base = getEditHref?.(id) ?? '';
                    return currentQuery ? `${base}${currentQuery}` : base;
                },
                onDeleteClick: (id) => {
                    setDeleteId(id);
                    setDeleteOpen(true);
                },
                enableDrag,
                onToggleFeatured: handleToggleFeatured,
            }),
        [data, visibleKeys, columnLabels, getEditHref, currentQuery, enableDrag]
    );

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination: serverPagination
                ? {
                      pageIndex: serverPagination.page - 1,
                      pageSize: 50,
                  }
                : undefined,
        },
        manualPagination: !!serverPagination,
        pageCount: serverPagination?.pageCount,
        getRowId: (row) => String((row as any).id),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    // 拖曳排序（只有啟用時才使用）
    function handleDragEnd(event: DragEndEvent) {
        if (!enableDrag) return;
        const { active, over } = event;
        if (!active || !over || active.id === over.id) return;

        const prev = data;
        const oldIndex = dataIds.indexOf(String(active.id));
        const newIndex = dataIds.indexOf(String(over.id));
        if (oldIndex === -1 || newIndex === -1) return;

        const next = arrayMove(prev, oldIndex, newIndex);
        setData(next);

        if (onReorder) {
            const ids = next.map((d) => String(d.id));
            (async () => {
                try {
                    await onReorder(ids);
                    toast({
                        variant: 'success',
                        title: '操作完成',
                        description: '排序已更新',
                        duration: 1500,
                    });
                    await onRefresh?.();
                } catch (e: any) {
                    setData(prev); // 還原
                    toast({
                        variant: 'destructive',
                        title: '排序更新失敗',
                        description: e?.message ?? '',
                    });
                }
            })();
        }
    }

    // 確認刪除
    const confirmDelete = async () => {
        if (!deleteId) return;
        if (!onDelete) {
            setDeleteOpen(false);
            return;
        }
        try {
            setDeleting(true);
            const res = await onDelete(deleteId);
            if (res?.error) {
                toast({
                    variant: 'destructive',
                    title: '刪除失敗',
                    description: res.error,
                });
                return;
            }
            setData((prev) => prev.filter((r) => String(r.id) !== deleteId));
            toast({
                variant: 'success',
                title: '操作完成',
                description: '已刪除 1 筆資料',
                duration: 1500,
            });
            await onRefresh?.();
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: '刪除失敗',
                description: e?.message ?? '發生未知錯誤',
            });
        } finally {
            setDeleting(false);
            setDeleteOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <>
            {/* 頂部：只有右側控制 */}
            <div className="flex items-center justify-end px-4 lg:px-6 lg:py-2">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between px-4 lg:px-6 lg:py-2">
                    {onSearch && (
                        <div className="relative flex w-full max-w-xs items-center">
                            <Input
                                placeholder="搜尋..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="pr-10"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSearchClick}
                                className="absolute right-1"
                            >
                                <IconSearch className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* 原本的右側控制列 */}
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-8">
                                    <IconLayoutColumns />
                                    <span className="hidden lg:inline">
                                        自定義顯示欄位
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (column) =>
                                            typeof column.accessorFn !==
                                                'undefined' &&
                                            column.getCanHide()
                                    )
                                    .map((column) => (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(v) =>
                                                column.toggleVisibility(!!v)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button asChild variant="outline" className="h-8">
                            <Link
                                href={addButtonHref}
                                className="inline-flex items-center gap-2"
                            >
                                <IconPlus />
                                <span className="hidden lg:inline">
                                    {addButtonLabel}
                                </span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 內容：Table + （視情況）DnD */}
            <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
                <div className="overflow-hidden rounded-lg border">
                    {enableDrag ? (
                        <DndContext
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis]}
                            onDragEnd={handleDragEnd}
                            sensors={sensors}
                        >
                            <TableContents
                                table={table}
                                dataIds={dataIds}
                                draggable
                            />
                        </DndContext>
                    ) : (
                        <TableContents
                            table={table}
                            dataIds={[]}
                            draggable={false}
                        />
                    )}
                </div>

                {/* 底部分頁 & 每頁數量 */}
                <PaginationBar
                    table={table}
                    serverPagination={serverPagination}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                />
            </div>

            {/* 內建 Confirm 刪除 */}
            <ConfirmDeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                loading={deleting}
                title="刪除資料"
                description="此操作無法復原，確定要刪除？"
                confirmText="刪除"
                cancelText="取消"
                onConfirm={confirmDelete}
            />
        </>
    );
}

/* ========================= 子區塊：表格內容 ========================= */
function TableContents({
    table,
    dataIds,
    draggable,
}: {
    table: ReturnType<typeof useReactTable<any>>;
    dataIds: UniqueIdentifier[];
    draggable: boolean;
}) {
    return (
        <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} colSpan={header.colSpan}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                      )}
                            </TableHead>
                        ))}
                    </TableRow>
                ))}
            </TableHeader>

            <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                    draggable ? (
                        <SortableContext
                            items={dataIds}
                            strategy={verticalListSortingStrategy}
                        >
                            {table.getRowModel().rows.map((row) => (
                                <DraggableRow key={row.id} row={row} />
                            ))}
                        </SortableContext>
                    ) : (
                        table
                            .getRowModel()
                            .rows.map((row) => (
                                <PlainRow key={row.id} row={row} />
                            ))
                    )
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={table.getAllColumns().length}
                            className="h-24 text-center"
                        >
                            No results.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

/* ========================= 子區塊：分頁列 ========================= */
function PaginationBar({
    table,
    serverPagination,
    onPageChange,
    onPageSizeChange,
}: {
    table: ReturnType<typeof useReactTable<any>>;
    serverPagination?: {
        page: number;
        pageSize: number;
        total: number;
        pageCount: number;
    };
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}) {
    if (serverPagination) {
        const { page, pageSize, pageCount, total } = serverPagination;
        return (
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm">每頁固定顯示 50 筆</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(1)}
                        disabled={page <= 1}
                    >
                        第一頁
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(page - 1)}
                        disabled={page <= 1}
                    >
                        上一頁
                    </Button>
                    <span className="text-sm">（共 {total} 筆）</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(page + 1)}
                        disabled={page >= pageCount}
                    >
                        下一頁
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(pageCount)}
                        disabled={page >= pageCount}
                    >
                        最後一頁
                    </Button>
                </div>
            </div>
        );
    }

    // ✅ 前端分頁模式 (原本的)
    return (
        <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
                <span className="text-sm">顯示筆數</span>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
                >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                            {pageSize}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    第一頁
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    上一頁
                </Button>
                <span className="text-sm">
                    Page {table.getState().pagination.pageIndex + 1} of{' '}
                    {table.getPageCount()}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    下一頁
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    最後一頁
                </Button>
            </div>
        </div>
    );
}

/* ========================= Drawer cell（示例） ========================= */
function TableCellViewer({ item }: { item: Record<string, any> }) {
    const isMobile = useIsMobile();

    return (
        <Drawer direction={isMobile ? 'bottom' : 'right'}>
            <DrawerTrigger asChild>
                <Button
                    variant="link"
                    className="text-foreground w-fit px-0 text-left"
                >
                    {String(item?.header ?? '')}
                </Button>
            </DrawerTrigger>

            <DrawerContent>
                <DrawerHeader className="gap-1">
                    <DrawerTitle>{String(item?.header ?? '')}</DrawerTitle>
                    <DrawerDescription>
                        Showing total visitors for the last 6 months
                    </DrawerDescription>
                </DrawerHeader>

                <div className="px-4 py-2 text-sm text-muted-foreground">
                    這裡可放更多細節內容或自訂編輯表單。
                </div>

                <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose asChild>
                        <Button variant="outline">Done</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
