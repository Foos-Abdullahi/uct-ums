import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface UctPanelCardProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    description?: React.ReactNode;
    badge?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    actions?: React.ReactNode;
    type?: 'default' | 'delete' | 'info' | 'success' | 'warning';
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    children?: React.ReactNode;
}

export function UctPanelCard({
    title,
    subtitle,
    description,
    badge,
    icon: Icon,
    actions,
    type = 'default',
    collapsible = false,
    defaultCollapsed = false,
    className,
    headerClassName,
    contentClassName,
    children,
}: UctPanelCardProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    // Theme styles matching UCT University Design System
    const typeStyles = {
        default: 'border-l-4 border-l-primary bg-card hover:border-primary/80',
        delete: 'border-l-4 border-l-destructive bg-destructive/5 hover:border-destructive',
        info: 'border-l-4 border-l-sky-500 bg-sky-500/5',
        success: 'border-l-4 border-l-emerald-500 bg-emerald-500/5',
        warning: 'border-l-4 border-l-amber-500 bg-amber-500/5',
    };

    const iconStyles = {
        default: 'bg-primary/10 text-primary border-primary/20',
        delete: 'bg-destructive/10 text-destructive border-destructive/20',
        info: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
        success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    };

    const headerContent = (
        <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                {Icon && (
                    <div
                        className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-colors',
                            iconStyles[type] || iconStyles.default
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                )}
                <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {title && (
                            <h3 className="text-sm font-semibold tracking-tight text-foreground">
                                {title}
                            </h3>
                        )}
                        {badge && <div>{badge}</div>}
                    </div>

                    {subtitle && (
                        <p className="text-xs font-medium text-muted-foreground">
                            {subtitle}
                        </p>
                    )}

                    {description && (
                        <p className="text-xs text-muted-foreground/80 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div
                    className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    {actions}
                </div>
            )}
        </div>
    );

    return (
        <div
            className={cn(
                'group relative rounded-lg border border-border/60 shadow-xs transition-all duration-200 overflow-hidden',
                typeStyles[type] || typeStyles.default,
                className
            )}
        >
            {/* Top subtle UCT gradient strip */}
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />

            {/* Card Header */}
            {(title || subtitle || description || Icon || actions) && (
                <div
                    className={cn(
                        'flex items-center justify-between p-5 border-b border-border/40',
                        collapsible && 'cursor-pointer select-none hover:bg-muted/40 transition-colors',
                        headerClassName
                    )}
                    onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
                >
                    {headerContent}

                    {collapsible && (
                        <button
                            type="button"
                            className="ml-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-transform duration-200"
                            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                        >
                            <ChevronDown
                                className={cn(
                                    'h-4 w-4 transition-transform duration-200',
                                    isCollapsed ? '-rotate-90' : 'rotate-0'
                                )}
                            />
                        </button>
                    )}
                </div>
            )}

            {/* Card Body */}
            {children && !isCollapsed && (
                <div className={cn('p-5 space-y-4', contentClassName)}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default UctPanelCard;
