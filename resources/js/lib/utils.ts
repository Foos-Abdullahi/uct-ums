import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatDate(
    value: string | Date | null | undefined,
    format: 'short' | 'long' | 'iso' = 'short',
): string {
    if (!value) return '—';

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return '—';
        if (format === 'iso') {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        return value.toLocaleDateString('en-US', {
            year: 'numeric',
            month: format === 'long' ? 'long' : 'short',
            day: 'numeric',
        });
    }

    const clean = value.includes('T') ? value.split('T')[0] : value;
    const parts = clean.split('-');

    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);

        if (Number.isNaN(date.getTime())) return value;

        if (format === 'iso') {
            return clean;
        }

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: format === 'long' ? 'long' : 'short',
            day: 'numeric',
        });
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: format === 'long' ? 'long' : 'short',
        day: 'numeric',
    });
}

export function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
