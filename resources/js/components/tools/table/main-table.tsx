import { router } from '@inertiajs/react';
import type {
    ColumnDef,
    ColumnFiltersState,
    Row,
    SortingState,
    Table as TableType,
    VisibilityState,
} from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import { useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTablePagination } from './pagination';
import { DataTableToolbar } from './toolbar';
import type {
    DataTableDateRangeFilter,
    DataTableServerFilter,
} from './types';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    title: string;
    searchTitle: string;
    searchable?: boolean;
    hidePagination?: boolean | true;
    hideFilter?: boolean;
    showToolbarOnly?: boolean;
    subTitle?: string;
    onDeleteSelected?: (selectedRows: TData[]) => void;
    // Optional view mode wiring to surface a toggle in the toolbar
    viewMode?: 'table' | 'grid';
    onViewModeChange?: (mode: 'table' | 'grid') => void;
    variant?: 'default' | 'futuristic';
    onRowClick?: (row: Row<TData>) => void;
    rowHref?: (row: Row<TData>) => string | undefined;
    /** Merged onto the inner `<table>` (e.g. `table-fixed`). */
    tableClassName?: string;
    // Callback to expose table instance to parent
    onTableReady?: (table: TableType<TData>) => void;
    // Server-side pagination props
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    serverFilters?: DataTableServerFilter[];
    onServerFilterChange?: (
        key: string,
        values: string[] | undefined,
    ) => void;
    onServerFilterClear?: () => void;
    dateRangeFilter?: DataTableDateRangeFilter;
    onDateRangeChange?: (range: DataTableDateRangeFilter) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    title,
    searchTitle,
    hidePagination,
    hideFilter,
    showToolbarOnly,
    searchable = true,
    onDeleteSelected,
    viewMode,
    onViewModeChange,
    variant = 'default',
    onRowClick,
    rowHref,
    tableClassName,
    onTableReady,
    pagination,
    onPageChange,
    onPageSizeChange,
    serverFilters,
    onServerFilterChange,
    onServerFilterClear,
    dateRangeFilter,
    onDateRangeChange,
}: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = React.useState({});
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [sorting, setSorting] = React.useState<SortingState>([]);

    // Function to reset row selection
    const resetRowSelection = () => {
        setRowSelection({});
    };

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: hidePagination
                    ? data.length
                    : pagination?.per_page || 50,
            },
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        globalFilterFn: (row, _columnId, filterValue) => {
            const search = String(filterValue ?? '')
                .trim()
                .toLowerCase();

            if (search === '') {
                return true;
            }

            return Object.values(row.original as Record<string, unknown>).some(
                (value) =>
                    value !== null &&
                    value !== undefined &&
                    String(value).toLowerCase().includes(search),
            );
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        ...(pagination
            ? {
                  manualPagination: true,
                  pageCount: pagination.last_page,
              }
            : hidePagination
              ? {}
              : {
                    getPaginationRowModel: getPaginationRowModel(),
                }),
    });

    // Call onTableReady when table instance is created
    useEffect(() => {
        if (onTableReady) {
            onTableReady(table);
        }
    }, [table, onTableReady]);

    const rowNavigable = Boolean(onRowClick || rowHref);

    const handleRowSelected = (row: Row<TData>) => {
        if (onRowClick) {
            onRowClick(row);

            return;
        }

        if (rowHref) {
            const href = rowHref(row);

            if (href) {
                router.visit(href);
            }
        }
    };

    // Enhanced delete handler that resets selection
    const handleDeleteSelected = (selectedRows: TData[]) => {
        if (onDeleteSelected) {
            onDeleteSelected(selectedRows);
            // Reset row selection after deletion
            resetRowSelection();
        }
    };

    const isFuturistic = variant === 'futuristic';

    return (
        <div className="flex flex-col gap-4">
            {(searchable || showToolbarOnly) && (
                <DataTableToolbar
                    title={title}
                    searchPlaceholder={searchTitle}
                    table={table}
                    onDeleteSelected={handleDeleteSelected}
                    viewMode={viewMode}
                    onViewModeChange={onViewModeChange}
                    hideFilter={hideFilter}
                    showToolbarOnly={showToolbarOnly}
                    serverFilters={serverFilters}
                    onServerFilterChange={onServerFilterChange}
                    onServerFilterClear={onServerFilterClear}
                    dateRangeFilter={dateRangeFilter}
                    onDateRangeChange={onDateRangeChange}
                />
            )}
            <div
                className={
                    isFuturistic
                        ? 'relative overflow-hidden rounded-sm border border-border/10 bg-card/40 shadow-sm backdrop-blur-xl dark:border-border/20'
                        : 'rounded-sm border border-border/30 bg-card shadow-sm dark:border-border/80'
                }
            >
                <Table className={cn(tableClassName)}>
                    <TableHeader className="sticky top-0 z-10 h-fit border-b border-border bg-card dark:bg-muted backdrop-blur-sm dark:border-border/60">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                className=""
                                key={headerGroup.id}
                            >
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={cn(
                                                'py-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase',
                                                isFuturistic
                                                    ? 'tracking-wide'
                                                    : undefined,
                                                (
                                                    header.column.columnDef
                                                        .meta as any
                                                )?.thClassName,
                                            )}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="bg-primary/5 dark:bg-primary/5">
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                    onClick={
                                        rowNavigable
                                            ? (e) => {
                                                  if (
                                                      e.target instanceof
                                                          HTMLInputElement &&
                                                      e.target.type ===
                                                          'checkbox'
                                                  ) {
                                                      return;
                                                  }

                                                  handleRowSelected(row);
                                              }
                                            : undefined
                                    }
                                    className={
                                        isFuturistic
                                            ? rowNavigable
                                                ? 'cursor-pointer border-b border-b-black/5 transition-colors hover:bg-primary/5 dark:border-b-white/15 dark:hover:bg-white/5'
                                                : 'border-b border-b-black/5 transition-colors dark:border-b-white/15'
                                            : rowNavigable
                                              ? 'cursor-pointer border-b border-border/80 hover:bg-muted/50 dark:border-border/60 dark:hover:bg-muted/30'
                                              : 'border-b border-border/80 dark:border-border/60'
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cn(
                                                isFuturistic
                                                    ? 'border-border/40 p-3'
                                                    : undefined,
                                                (
                                                    cell.column.columnDef
                                                        .meta as any
                                                )?.tdClassName,
                                            )}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {!hidePagination && (
                <DataTablePagination
                    table={table}
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                />
            )}
        </div>
    );
}
