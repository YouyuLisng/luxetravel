'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCircleCheckFilled, IconDotsVertical, IconLoader } from '@tabler/icons-react';

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useToast } from '@/hooks/use-toast';
import { useLoadingStore } from '@/stores/useLoadingStore';

// ✅ 使用你的 User Server Actions
import { deleteUser, editUser } from '@/app/admin/users/action/user';
import { Badge } from '@/components/ui/badge';

export type UserEntity = {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    emailVerified?: string | Date | null;
    createdAt: string | Date;

    image?: string | null;
    updatedAt?: string | Date | null;
};

const formatDate = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleString('zh-TW') : '—';

const getInitials = (name?: string | null, email?: string | null) => {
    const src = (name || email || '').trim();
    if (!src) return 'U';
    const parts = src.split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return src.slice(0, 1).toUpperCase();
};

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

const columnsBase: ColumnDef<UserEntity>[] = [
    {
        id: 'user',
        header: '使用者',
        cell: ({ row }) => <AvatarCell user={row.original} />,
    },
    {
        accessorKey: 'role',
        header: '角色',
        cell: ({ row }) => (
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                {row.original.role}
            </span>
        ),
    },
    {
        accessorKey: 'emailVerified',
        header: '信箱驗證',
        cell: ({ row }) => (
            <Badge variant="outline" className="text-muted-foreground px-1.5">
                {row.original.emailVerified ? (
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
        ),
    },
    {
        accessorKey: 'createdAt',
        header: '建立時間',
        cell: ({ row }) => formatDate(row.original.createdAt),
    },
    { id: 'actions', header: '操作' },
];

function RowActions({
    user,
    onPatched,
    onBeginDelete,
    onEndDelete,
    removeRow,
}: {
    user: UserEntity;
    onPatched: (id: string, patch: Partial<UserEntity>) => void;
    onBeginDelete: () => void;
    onEndDelete: () => void;
    removeRow: (id: string) => void;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const { show, hide } = useLoadingStore();

    const stop = (e: React.SyntheticEvent) => e.stopPropagation();

    const handleVerifyNow = async () => {
        if (user.emailVerified) return;
        show();
        try {
            const res = await editUser(user.id, { verifyNow: true });
            if (res?.error) throw new Error(res.error);
            // 更新本列
            onPatched(user.id, { emailVerified: new Date().toISOString() });
            router.refresh();
            toast({ title: '已標記為已驗證', duration: 1200 });
        } catch (err: any) {
            toast({
                title: '操作失敗',
                description: err?.message ?? '請稍後再試',
                variant: 'destructive',
            });
        } finally {
            hide();
        }
    };

    const handleConfirmDelete = async (): Promise<void> => {
        onBeginDelete();
        show();
        try {
            const res = await deleteUser(user.id);
            if (res?.error) throw new Error(res.error);

            hide();
            removeRow(user.id);
            router.refresh();
            toast({
                title: '刪除成功',
                description: `已刪除「${user.name || user.email || user.id}」`,
                duration: 1500,
            });
        } catch (err: any) {
            hide();
            toast({
                title: '刪除失敗',
                description: err?.message ?? '請稍後再試',
                variant: 'destructive',
                duration: 1500,
            });
            throw err;
        } finally {
            onEndDelete();
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                    size="icon"
                    onPointerDown={stop}
                    onClick={stop}
                >
                    <IconDotsVertical />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-40"
                onPointerDown={stop}
                onClick={stop}
            >
                <DropdownMenuItem asChild>
                    <Link href={`/admin/users/${user.id}`}>編輯</Link>
                </DropdownMenuItem>

                {!user.emailVerified && (
                    <DropdownMenuItem
                        onSelect={(e) => (
                            e.preventDefault(),
                            handleVerifyNow()
                        )}
                    >
                        立即標記已驗證
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <ConfirmDeleteDialog
                    onConfirm={handleConfirmDelete}
                    title="刪除使用者"
                    description={`確定要刪除「${user.name || user.email || user.id}」嗎？此操作無法復原。`}
                    trigger={
                        <DropdownMenuItem
                            className="text-red-600"
                            onSelect={(e) => e.preventDefault()}
                        >
                            刪除
                        </DropdownMenuItem>
                    }
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function NormalRow({ row }: { row: Row<UserEntity> }) {
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

export function UserDataTable({ data }: { data: UserEntity[] }) {
    console.log(data)
    const [rows, setRows] = React.useState<UserEntity[]>(() => data);
    const deletingRef = React.useRef(false);

    React.useEffect(() => {
        if (!deletingRef.current) setRows(data);
    }, [data]);

    const onBeginDelete = React.useCallback(() => {
        deletingRef.current = true;
    }, []);
    const onEndDelete = React.useCallback(() => {
        deletingRef.current = false;
    }, []);

    const removeRow = React.useCallback((id: string) => {
        setRows((prev) => prev.filter((u) => u.id !== id));
    }, []);

    const patchRow = React.useCallback(
        (id: string, patch: Partial<UserEntity>) => {
            setRows((prev) =>
                prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
            );
        },
        []
    );

    const columns = React.useMemo<ColumnDef<UserEntity>[]>(() => {
        return columnsBase.map((col) =>
            col.id === 'actions'
                ? {
                      ...col,
                      cell: ({ row }) => (
                          <RowActions
                              user={row.original}
                              onPatched={patchRow}
                              onBeginDelete={onBeginDelete}
                              onEndDelete={onEndDelete}
                              removeRow={removeRow}
                          />
                      ),
                  }
                : col
        );
    }, [onBeginDelete, onEndDelete, removeRow, patchRow]);

    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const table = useReactTable({
        data: rows,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        getRowId: (row) => row.id,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <Tabs
            defaultValue="outline"
            className="w-full flex-col justify-start gap-6"
        >
            <TabsContent
                value="outline"
                className="relative flex flex-col gap-4 overflow-auto"
            >
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table
                                    .getRowModel()
                                    .rows.map((row) => (
                                        <NormalRow key={row.id} row={row} />
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>
        </Tabs>
    );
}
