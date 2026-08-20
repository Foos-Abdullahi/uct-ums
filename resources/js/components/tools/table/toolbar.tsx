import type { Table } from '@tanstack/react-table';
import {
    Filter,
    FilterX,
    LayoutGrid,
    List,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DataTableFacetedFilter } from './faceted-filter';
import type {
    DataTableDateRangeFilter,
    DataTableServerFilter,
} from './types';
import { DataTableViewOptions } from './view-options';

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
    title: string;
    searchPlaceholder: string;
    onDeleteSelected?: (selectedRows: TData[]) => void;
    viewMode?: 'table' | 'grid';
    onViewModeChange?: (mode: 'table' | 'grid') => void;
    hideFilter?: boolean;
    showToolbarOnly?: boolean;
    serverFilters?: DataTableServerFilter[];
    onServerFilterChange?: (
        key: string,
        values: string[] | undefined,
    ) => void;
    onServerFilterClear?: () => void;
    dateRangeFilter?: DataTableDateRangeFilter;
    onDateRangeChange?: (range: DataTableDateRangeFilter) => void;
}

export function DataTableToolbar<TData>({
    table,
    title,
    searchPlaceholder,
    onDeleteSelected,
    viewMode,
    onViewModeChange,
    hideFilter,
    showToolbarOnly,
    serverFilters,
    onServerFilterChange,
    onServerFilterClear,
    dateRangeFilter,
    onDateRangeChange,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0;
    const hasServerFilters = (serverFilters ?? []).some(
        (filter) => filter.value,
    );
    const hasDateRangeFilter = Boolean(
        dateRangeFilter?.start_date || dateRangeFilter?.end_date,
    );

    const columnToFilter = () => {
        switch (title) {
            case 'Users':
            case 'Roles':
            case 'Brands':
            case 'Product Types':
            case 'Categories':
                return 'name';
            case 'Purchases':
                return 'purchase_no';
            case 'Sales':
                return 'sale_no';
            case 'Customers':
            case 'Suppliers':
                return 'name';
            case 'Quotations':
                return 'quotation_no';
            case 'Conversions':
                return 'from_product';
            case 'Products':
                return 'name';
            case 'Category':
                return 'name';
            case 'Carriers':
                return 'name';
            case 'Carrier Pricings':
                return 'carrier_name';
            case 'Service Rates':
                return 'shipment_method_name';
            case 'Quotations':
                return 'id';
            default: {
                const availableColumns = table.getAllColumns();
                const searchableColumns = [
                    'name',
                    'title',
                    'purchase_no',
                    'sale_no',
                    'carrier_name',
                    'shipment_method_name',
                    'method_name',
                ];

                for (const col of searchableColumns) {
                    if (availableColumns.find((c) => c.id === col)) {
                        return col;
                    }
                }

                const firstColumn = availableColumns.find(
                    (c) => c.id !== 'select' && c.id !== 'actions',
                );

                return firstColumn?.id || 'name';
            }
        }
    };

    const [showFilters, setShowFilters] = useState(false);

    const [searchInput, setSearchInput] = useState<string>(() => {
        const columnId = columnToFilter();
        const column = table.getColumn(columnId);

        return (column?.getFilterValue() as string) ?? '';
    });

    useEffect(() => {
        const globalFilterValue =
            (table.getState().globalFilter as string) ?? '';
        setSearchInput(globalFilterValue);
    }, [table.getState().globalFilter, table]);

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const hasSelectedRows = selectedRows.length > 0;

    const usesServerFilters = (serverFilters?.length ?? 0) > 0;

    const getColumnFilterOptions = (columnId: string) => {
        const column = table
            .getAllColumns()
            .find((col) => col.id === columnId);

        if (!column) {
            return [];
        }

        const uniqueValues = column.getFacetedUniqueValues();

        return Array.from(uniqueValues.keys())
            .filter(
                (value) =>
                    value !== null && value !== undefined && value !== '',
            )
            .map((value) => ({
                label: String(value)
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (letter: string) =>
                        letter.toUpperCase(),
                    ),
                value: String(value),
            }));
    };

    const statusFilterOptions = usesServerFilters
        ? []
        : getColumnFilterOptions('status');
    const paymentStatusFilterOptions = usesServerFilters
        ? []
        : getColumnFilterOptions('payment_status');
    const brandFilterOptions = usesServerFilters
        ? []
        : getColumnFilterOptions('brand');
    const categoryFilterOptions = usesServerFilters
        ? []
        : getColumnFilterOptions('category');
    const roleFilterOptions = usesServerFilters
        ? []
        : getColumnFilterOptions('role');

    const handleSearch = (value: string) => {
        setSearchInput(value);
        table.setGlobalFilter(value);
    };

    const handleDeleteSelected = () => {
        if (onDeleteSelected && hasSelectedRows) {
            onDeleteSelected(selectedRows.map((row) => row.original));
        }
    };

    const handleResetFilters = () => {
        table.resetColumnFilters();

        if (onDateRangeChange) {
            onDateRangeChange({});
        }

        if (onServerFilterClear) {
            onServerFilterClear();
        }
    };

    const handleStartDateChange = (value: string) => {
        onDateRangeChange?.({
            start_date: value || undefined,
            end_date: dateRangeFilter?.end_date,
        });
    };

    const handleEndDateChange = (value: string) => {
        onDateRangeChange?.({
            start_date: dateRangeFilter?.start_date,
            end_date: value || undefined,
        });
    };

    const getColumnById = (columnId: string) =>
        table.getAllColumns().find((col) => col.id === columnId);

    const renderClientFilters = () => {
        if (usesServerFilters) {
            return null;
        }

        const statusColumn = getColumnById('status');
        const paymentStatusColumn = getColumnById('payment_status');
        const categoryColumn = getColumnById('category');
        const brandColumn = getColumnById('brand');
        const roleColumn = getColumnById('role');

        return (
            <>
                {statusFilterOptions.length > 0 && statusColumn && (
                    <DataTableFacetedFilter
                        title="Status"
                        column={statusColumn}
                        options={statusFilterOptions}
                        mode="single"
                    />
                )}

                {paymentStatusFilterOptions.length > 0 &&
                    paymentStatusColumn && (
                        <DataTableFacetedFilter
                            title="Payment"
                            column={paymentStatusColumn}
                            options={paymentStatusFilterOptions}
                            mode="single"
                        />
                    )}

                {categoryFilterOptions.length > 0 && categoryColumn && (
                    <DataTableFacetedFilter
                        title="Category"
                        column={categoryColumn}
                        options={categoryFilterOptions}
                        mode="single"
                    />
                )}

                {brandFilterOptions.length > 0 && brandColumn && (
                    <DataTableFacetedFilter
                        title="Brand"
                        column={brandColumn}
                        options={brandFilterOptions}
                        mode="single"
                    />
                )}

                {roleFilterOptions.length > 0 && roleColumn && (
                    <DataTableFacetedFilter
                        title="Role"
                        column={roleColumn}
                        options={roleFilterOptions}
                        mode="single"
                    />
                )}
            </>
        );
    };

    const renderServerFilters = () => {
        if (!serverFilters?.length) {
            return null;
        }

        return serverFilters.map((filter) => (
            <DataTableFacetedFilter
                key={filter.key}
                title={filter.title}
                options={filter.options}
                value={filter.value ? [filter.value] : []}
                mode="single"
                onValueChange={(values) =>
                    onServerFilterChange?.(filter.key, values)
                }
            />
        ));
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                {!showToolbarOnly && (
                    <div className="flex flex-1 items-center gap-3">
                        <div className="relative w-full md:w-1/2">
                            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={searchInput}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) => {
                                    handleSearch(event.target.value);
                                }}
                                className="h-9 rounded-sm  pr-8 pl-8 text-lg text-foreground placeholder:text-xs"
                            />
                            {searchInput && (
                                <button
                                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleSearch('')}
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {hasSelectedRows && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteSelected}
                                className="flex h-8 items-center gap-2 px-3"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete ({selectedRows.length})
                            </Button>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3">
                    {onViewModeChange && (
                        <ToggleGroup
                            type="single"
                            value={viewMode}
                            onValueChange={(v) =>
                                v && onViewModeChange(v as 'table' | 'grid')
                            }
                            variant="outline"
                            size="sm"
                        >
                            <ToggleGroupItem
                                value="table"
                                aria-label="Table view"
                                className="px-2"
                            >
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="grid"
                                aria-label="Grid view"
                                className="px-2"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    )}

                    {!hideFilter && (
                        <Button
                            variant={'outline'}
                            size={'sm'}
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex gap-1 rounded-sm px-2 py-0 ${showFilters ? 'text-red-600 hover:bg-red-600/10 hover:text-red-600' : ''}`}
                        >
                            {!showFilters ? (
                                <Filter size={20} />
                            ) : (
                                <FilterX size={20} />
                            )}{' '}
                            Filter
                        </Button>
                    )}
                    <DataTableViewOptions table={table} />
                </div>
            </div>
            <div>
                {showFilters && (
                    <div className="flex flex-wrap gap-2">
                        {renderServerFilters()}
                        {renderClientFilters()}

                        {dateRangeFilter !== undefined && (
                            <div className="flex items-center gap-2 rounded-sm border border-input bg-white px-2 py-1 text-xs shadow-sm">
                                <span className="font-medium text-muted-foreground">
                                    Date:
                                </span>
                                <input
                                    type="date"
                                    value={dateRangeFilter.start_date ?? ''}
                                    onChange={(event) =>
                                        handleStartDateChange(
                                            event.target.value,
                                        )
                                    }
                                    className="cursor-pointer bg-transparent text-foreground outline-none"
                                />
                                <span className="text-muted-foreground">to</span>
                                <input
                                    type="date"
                                    value={dateRangeFilter.end_date ?? ''}
                                    onChange={(event) =>
                                        handleEndDateChange(event.target.value)
                                    }
                                    className="cursor-pointer bg-transparent text-foreground outline-none"
                                />
                            </div>
                        )}

                        {(isFiltered ||
                            hasServerFilters ||
                            hasDateRangeFilter) && (
                            <Button
                                variant="ghost"
                                onClick={handleResetFilters}
                                className="h-8 px-2 lg:px-3"
                            >
                                Reset
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
