import type { Column } from '@tanstack/react-table';
import { Check, CircleFadingPlus } from 'lucide-react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>;
    title?: string;
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
    value?: string[];
    onValueChange?: (values: string[] | undefined) => void;
    /** Single: pick one option at a time (clicking another replaces). Multi: checkbox-style. */
    mode?: 'single' | 'multi';
}

export function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
    value,
    onValueChange,
    mode = 'single',
}: DataTableFacetedFilterProps<TData, TValue>) {
    const isControlled = value !== undefined && onValueChange !== undefined;
    const selectedValues = new Set(
        isControlled ? value : ((column?.getFilterValue() as string[]) ?? []),
    );

    const applyValues = (filterValues: string[] | undefined) => {
        if (isControlled) {
            onValueChange(filterValues);

            return;
        }

        column?.setFilterValue(
            filterValues?.length ? filterValues : undefined,
        );
    };

    const handleSelect = (optionValue: string) => {
        if (mode === 'single') {
            if (selectedValues.has(optionValue)) {
                applyValues(undefined);
            } else {
                applyValues([optionValue]);
            }

            return;
        }

        const newSelectedValues = new Set(selectedValues);

        if (newSelectedValues.has(optionValue)) {
            newSelectedValues.delete(optionValue);
        } else {
            newSelectedValues.add(optionValue);
        }

        const filterValues = Array.from(newSelectedValues);
        applyValues(filterValues.length ? filterValues : undefined);
    };

    const clearFilters = () => {
        applyValues(undefined);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-sm border-dashed border-primary/50 bg-white dark:bg-muted/60"
                >
                    <CircleFadingPlus className="mr-2 h-4 w-4" />
                    {title}
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator
                                orientation="vertical"
                                className="mx-2 h-4"
                            />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) =>
                                            selectedValues.has(option.value),
                                        )
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(
                                    option.value,
                                );

                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() =>
                                            handleSelect(option.value)
                                        }
                                        className="cursor-pointer aria-selected:bg-muted/50 data-[selected=true]:bg-muted/50 data-[selected=true]:text-foreground"
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible',
                                            )}
                                        >
                                            <Check className="h-4 w-4" />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={clearFilters}
                                        className="cursor-pointer justify-center text-center aria-selected:bg-muted/50 data-[selected=true]:bg-muted/50 data-[selected=true]:text-foreground"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
