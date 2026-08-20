import { ArrowDown, ChevronDown, } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type DataTableRowActionsMenuProps = {
    children: React.ReactNode;
    align?: 'start' | 'center' | 'end';
    /**
     * `default` — “Action” label + more icon (standard tables).
     * `icon` — icon-only trigger (compact).
     * `chevron` — “action” + chevron (legacy reference).
     */
    trigger?: 'default' | 'icon' | 'chevron';
};

const actionTriggerButtonClass =
    'h-8 shrink-0 gap-1.5 bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/15 hover:text-primary';

/**
 * Single trigger per table row; place {@link DataTableRowActionItem} children inside the menu.
 */
export function DataTableRowActionsMenu({
    children,
    align = 'end',
    trigger = 'default',
}: DataTableRowActionsMenuProps) {
    return (
        <div className="flex justify-start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {trigger === 'chevron' ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(actionTriggerButtonClass, 'lowercase')}
                        >
                            <ChevronDown className="size-3.5 opacity-80" />
                        </Button>
                    ) : trigger === 'icon' ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                            aria-label="Row actions"
                        >
                            <ChevronDown className="size-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={actionTriggerButtonClass}
                            aria-label="Open row actions"
                        >
                            Action
                            <ChevronDown className="size-4 opacity-90" />
                        </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align={align} className="min-w-[10rem]">
                    {children}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

const primaryActionItemClass =
    'cursor-pointer gap-2 text-primary focus:bg-primary/10 focus:text-primary [&_svg]:text-primary';

type DataTableRowActionItemProps = React.ComponentProps<typeof DropdownMenuItem>;

export function DataTableRowActionItem({ className, ...props }: DataTableRowActionItemProps) {
    return <DropdownMenuItem className={cn(primaryActionItemClass, className)} {...props} />;
}

export function DataTableRowActionItemDestructive({
    className,
    ...props
}: DataTableRowActionItemProps) {
    return (
        <DropdownMenuItem
            className={cn(
                'cursor-pointer gap-2',
                // Theme tokens use destructive-foreground = light (for text on red buttons).
                // On a white popover, that reads as invisible — use destructive (red) for label + icons.
                'text-destructive [&_svg]:text-destructive',
                'focus:bg-destructive/10 focus:text-destructive [&_svg]:focus:text-destructive',
                'data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive [&_svg]:data-[highlighted]:text-destructive',
                className,
            )}
            {...props}
        />
    );
}
