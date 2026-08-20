import type { Column } from '@tanstack/react-table';
import { ChevronDown, ChevronsUpDown, ChevronUp, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>;
    title: string;
}

export function DataTableColumnHeader<TData, TValue>({
    column,
    title,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    if (!column.getCanSort()) {
        return <div className={cn('border-r border-border last:border-r-0 pr-3', className)}>{title}</div>;
    }

    return (
        <div className={cn('flex border-r border-border last:border-r-0 pr-3', className)}>
            <DropdownMenu>
                <DropdownMenuTrigger
                    className="flex items-center justify-start"
                    asChild
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-8 w-fit border-none font-semibold uppercase ring-0 hover:bg-transparent focus-visible:border-none data-[state=open]:text-foreground data-[state=open]:outline-none"
                    >
                        <span className="font-medium uppercase">{title}</span>
                        {column.getIsSorted() === 'desc' ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(false)}
                    >
                        <ChevronUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => column.toggleSorting(true)}
                    >
                        <ChevronDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Desc
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => column.toggleVisibility(false)}
                    >
                        <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Hide
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
