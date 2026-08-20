import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export interface StatSection {
  title: string;
  value: string | number;
  badge?: {
    text: string;
    trend?: 'up' | 'down';
    icon?: React.ReactNode;
    variant?: 'blue' | 'green' | 'emerald' | 'red' | 'amber' | 'purple' | 'gray';
  };
  description?: string;
}

export interface StatsCardProps {
  sections: StatSection[];
  className?: string;
}

const badgeVariants: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10',
  green: 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/10',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10',
  red: 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/10',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10',
  purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/10',
  gray: 'bg-muted text-muted-foreground hover:bg-muted',
};

export function StatsCard({ sections, className = '' }: StatsCardProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="grid grid-cols-1 divide-y divide-border group cursor-pointer border-border/50 bg-muted/40 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-muted/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.06] rounded-sm md:grid-cols-4 md:divide-x md:divide-y-0">
        {sections.map((section, index) => (
          <div key={index} className="p-5">
            <p className="text-sm font-medium text-muted-foreground">{section.title}</p>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-bold text-foreground">{section.value}</span>
              {section.badge && (
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium ${badgeVariants[section.badge.variant || 'gray']}`}
                >
                  {section.badge.icon ? (
                    <span className="mr-0.5">{section.badge.icon}</span>
                  ) : section.badge.trend === 'up' ? (
                    <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  ) : section.badge.trend === 'down' ? (
                    <ArrowDownRight className="mr-0.5 h-3 w-3" />
                  ) : null}
                  {section.badge.text}
                </Badge>
              )}
            </div>
            {section.description && (
              <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
