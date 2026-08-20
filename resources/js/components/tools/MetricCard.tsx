import type { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface Stat {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  color?: 'primary' | 'info' | 'success' | 'warning' | 'destructive' | 'accent';
}

const colorStyles = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  info: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
  },
  warning: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    border: 'border-accent/20',
  },
  destructive: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/20',
  },
  accent: {
    bg: 'bg-accent/10',
    text: 'text-accent-foreground',
    border: 'border-accent/20',
  },
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  className = '',
  color = 'primary',
}: Stat) {
  const styles = colorStyles[color] || colorStyles.primary;

  return (
    <Card className={cn("overflow-hidden border-border/50 bg-card py-0  transition-all rounded-sm hover:shadow-sm shadow-none ring-1 ring-border hover:border-border", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          
          <div className="min-w-0 flex flex-col gap-1">
            <p className=" lg:text-xs text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {title}
            </p>
            <h3 className="text-xl font-medium tracking-tight text-foreground tabular-nums ">
              {value}
            </h3>
            {trend && (
              <div className={cn("flex items-center gap-1 text-[11px] text-muted-foreground" )}>
                <TrendingUp className={cn("h-3 w-3", styles.text)} />
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className={cn("flex h-7 w-7 items-center justify-center rounded-xs shrink-0 shadow-xs border", styles.bg, styles.border)}>
            <Icon className={cn("h-3.5 w-3.5", styles.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}