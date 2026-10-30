import type { LucideIcon } from 'lucide-react';

/**
 * ONLY real server/page errors.
 *
 * Removed:
 * 400
 * 401
 * 405
 * 408
 * 419
 * 422
 *
 * These should be handled by:
 * - forms
 * - validation
 * - middleware
 * - toast notifications
 * - auth redirects
 */

export type ErrorStatusCode =
    | 403
    | 404
    | 429
    | 500
    | 502
    | 503
    | 504;

export type ErrorColor =
    | 'blue'
    | 'purple'
    | 'orange'
    | 'red';

export interface ErrorConfig {
    title: string;
    description: string;
    color: ErrorColor;
    icon: LucideIcon;
    suggestions: string[];
    showRetry?: boolean;
    autoRetry?: boolean;
}

export interface ErrorPageProps {
    [key: string]: unknown;
    status: ErrorStatusCode;
    message?: string | null;

    requestId?: string | null;
    timestamp?: string | null;
    route?: string | null;

    debug?: {
        message?: string;
        file?: string;
        line?: number;
        trace?: string[];
    } | null;
}
