import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode} from 'react';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface UctSectionCardProps {
    /** Section heading, rendered in the UCT uppercase style */
    title?: ReactNode;
    /** Secondary line rendered under the title */
    description?: ReactNode;
    /** Free-form node rendered under the title (before the description) */
    subtitle?: ReactNode;
    /** Step / sequence marker shown in the navy chip left of the title */
    step?: ReactNode;
    icon?: LucideIcon;
    /** Node rendered next to the title, e.g. a status badge */
    badge?: ReactNode;
    /** Buttons rendered on the right side of the header */
    actions?: ReactNode;
    /** Collapse / expand the body through a Radix collapsible */
    collapsible?: boolean;
    /** Initial open state when collapsible */
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Glow the border and tint the accent red to flag a validation error */
    error?: boolean;
    /** Remove the body padding, e.g. for edge-to-edge tables */
    flush?: boolean;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    children: ReactNode;
}

/**
 * UCT-branded section card used across the admin panels for forms and detail
 * sections. It replaces the bare shadcn Card so every section shares the same
 * navy spine, uppercase header band and optional collapsible behaviour.
 */
export function UctSectionCard({
    title,
    description,
    subtitle,
    step,
    icon: Icon,
    badge,
    actions,
    collapsible = false,
    defaultOpen = true,
    onOpenChange,
    error = false,
    flush = false,
    className,
    headerClassName,
    contentClassName,
    children,
}: UctSectionCardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange?.(open);
    };

    const header = (
        <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                {step !== undefined && step !== null && (
                    <span
                        className={cn(
                            'flex h-6 min-w-6 shrink-0 items-center justify-center rounded-sm bg-primary px-1.5 text-[11px] font-bold text-primary-foreground',
                            error && 'bg-destructive',
                        )}
                    >
                        {step}
                    </span>
                )}

                {Icon && (
                    <span
                        className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-primary/20 bg-primary/10 text-primary',
                            error &&
                                'border-destructive/30 bg-destructive/10 text-destructive',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </span>
                )}

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        {title && (
                            <h2
                                className={cn(
                                    'text-xs font-bold tracking-[0.14em] text-primary uppercase dark:text-foreground',
                                    error &&
                                        'text-destructive dark:text-destructive',
                                )}
                            >
                                {title}
                            </h2>
                        )}
                        {badge}
                    </div>
                    {subtitle}
                    {description && (
                        <p className="mt-0.5 text-xs font-normal tracking-normal text-muted-foreground normal-case">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    {actions}
                </div>
            )}
        </div>
    );

    const body = (
        <div className={cn('text-xs', !flush && 'px-5 py-4', contentClassName)}>
            {children}
        </div>
    );

    const headerBand = cn(
        'w-full border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-3 text-left dark:from-primary/20 dark:via-primary/10',
        headerClassName,
    );

    return (
        <Card
            className={cn(
                // Distinct UCT silhouette: squared body with a single cut corner,
                // navy spine on the left edge and a tight, flat surface.
                'relative gap-0 overflow-hidden rounded-none rounded-tr-2xl border-border/50 bg-card py-0 shadow-xs transition-shadow',
                'before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-primary before:via-primary/70 before:to-primary/30 before:content-[""]',
                'pl-1.5 hover:shadow-md',
                error &&
                    'border-destructive ring-2 ring-destructive/25 before:from-destructive before:via-destructive/70 before:to-destructive/30',
                className,
            )}
        >
            {collapsible ? (
                <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
                    {(title || actions) && (
                        <CollapsibleTrigger
                            className={cn(
                                headerBand,
                                'group hover:bg-primary/10',
                            )}
                        >
                            <div className="flex w-full items-center justify-between gap-3">
                                {header}
                                <ChevronDown
                                    className={cn(
                                        'h-5 w-5 shrink-0 rounded-full border border-primary/20 bg-primary/10 p-0.5 text-primary transition-transform duration-200',
                                        isOpen && 'rotate-180',
                                    )}
                                />
                            </div>
                        </CollapsibleTrigger>
                    )}
                    <CollapsibleContent>{body}</CollapsibleContent>
                </Collapsible>
            ) : (
                <>
                    {(title || actions) && (
                        <div className={headerBand}>{header}</div>
                    )}
                    {body}
                </>
            )}
        </Card>
    );
}

export type { UctSectionCardProps };
