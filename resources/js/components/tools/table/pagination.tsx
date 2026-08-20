import { router } from '@inertiajs/react';
import type { Table } from '@tanstack/react-table';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

export function DataTablePagination<TData>({
    table,
    pagination,
    onPageChange,
    onPageSizeChange,
}: DataTablePaginationProps<TData>) {
    // Use server-side pagination if provided, otherwise fall back to client-side
    const isServerSide = !!pagination;

    const currentPage = isServerSide
        ? pagination!.current_page
        : table.getState().pagination.pageIndex + 1;
    const totalPages = isServerSide
        ? pagination!.last_page
        : table.getPageCount();
    const pageSize = isServerSide
        ? pagination!.per_page
        : table.getState().pagination.pageSize;
    const canPrevious = isServerSide
        ? currentPage > 1
        : table.getCanPreviousPage();
    const canNext = isServerSide
        ? currentPage < totalPages
        : table.getCanNextPage();

    const handlePageSizeChange = (value: string) => {
        const newSize = Number(value);

        if (onPageSizeChange) {
            onPageSizeChange(newSize);
        } else {
            table.setPageSize(newSize);
        }
    };

    const handleFirstPage = () => {
        if (onPageChange) {
            onPageChange(1);
        } else {
            table.setPageIndex(0);
        }
    };

    const handlePrevious = () => {
        if (onPageChange) {
            onPageChange(currentPage - 1);
        } else {
            table.previousPage();
        }
    };

    const handleNext = () => {
        if (onPageChange) {
            onPageChange(currentPage + 1);
        } else {
            table.nextPage();
        }
    };

    const handleLastPage = () => {
        if (onPageChange) {
            onPageChange(totalPages);
        } else {
            table.setPageIndex(table.getPageCount() - 1);
        }
    };

    return (
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-4 lg:flex-row lg:gap-1">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Show results per page</p>
                <Select
                    key={`per-page-${pageSize}`}
                    value={String(pageSize)}
                    onValueChange={handlePageSizeChange}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[50, 100, 200, 300, 400, 500].map((size) => (
                            <SelectItem key={size} value={`${size}`}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={handleFirstPage}
                        disabled={!canPrevious}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={handlePrevious}
                        disabled={!canPrevious}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={handleNext}
                        disabled={!canNext}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={handleLastPage}
                        disabled={!canNext}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
