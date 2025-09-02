'use client';

import * as React from 'react';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { IconDotsVertical } from '@tabler/icons-react';
import { ModuleEntity } from '@/features/module/queries/modulesQuery';

/* ================= Columns ================= */
const columns: ColumnDef<ModuleEntity>[] = [
    {
        accessorKey: 'title',
        header: '標題',
    },
    {
        accessorKey: 'subtitle',
        header: '副標題',
        cell: ({ row }) => row.original.subtitle ?? '—',
    },
    {
        accessorKey: 'createdAt',
        header: '建立時間',
        cell: ({ row }) =>
            new Date(row.original.createdAt).toLocaleString('zh-TW'),
    },
    {
        accessorKey: 'updatedAt',
        header: '更新時間',
        cell: ({ row }) =>
            new Date(row.original.updatedAt).toLocaleString('zh-TW'),
    },
    {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => <RowActions moduleItem={row.original} />,
    },
];

function RowActions({ moduleItem }: { moduleItem: ModuleEntity }) {
    const router = useRouter();
    const { toast } = useToast();

    const stop = (e: React.SyntheticEvent) => e.stopPropagation();

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
                className="w-36"
                onPointerDown={stop}
                onClick={stop}
            >
                {/* 依你的實際路徑調整：/admin/module 或 /admin/modules */}
                <DropdownMenuItem asChild>
                    <Link href={`/admin/modules/${moduleItem.id}`}>編輯</Link>
                </DropdownMenuItem>
                {/* 如果未來要加刪除，可在此加入 ConfirmDeleteDialog 與對應的 useDeleteModuleMutation */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ================ Table Component (no DnD) ================ */
export function ModuleDataTable({ data }: { data: ModuleEntity[] }) {
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
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
        },
        getRowId: (row) => row.id, // id 為 string
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
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
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
