import type { Table } from '@tanstack/react-table';
import { SlidersHorizontal } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableViewOptionsProps<TData> {
    table: Table<TData>;
}

export function DataTableViewOptions<TData>({
    table,
}: DataTableViewOptionsProps<TData>) {
    const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>({});

    const toggleableColumns = table
        .getAllColumns()
        .filter(
            (column) =>
                typeof column.accessorFn !== 'undefined' &&
                column.getCanHide(),
        );

    const isColumnVisible = useCallback(
        (columnId: string): boolean => {
            if (columnId in localVisibility) {
                return localVisibility[columnId];
            }

            return true;
        },
        [localVisibility],
    );

    const handleToggle = useCallback(
        (columnId: string) => {
            const column = table.getColumn(columnId);

            if (!column) {
return;
}

            const currentlyVisible = isColumnVisible(columnId);
            const newValue = !currentlyVisible;

            column.toggleVisibility(newValue);
            setLocalVisibility((prev) => ({ ...prev, [columnId]: newValue }));
        },
        [table, isColumnVisible],
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto rounded-sm  hidden h-8 lg:flex"
                >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {toggleableColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={isColumnVisible(column.id)}
                        onCheckedChange={() => handleToggle(column.id)}
                        onSelect={(e) => e.preventDefault()}
                    >
                        {column.id}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
