import {
    Clock,
    Ghost,
    SearchX,
    ServerCrash,
    ShieldAlert,
} from 'lucide-react';

import type {
    ErrorConfig,
    ErrorStatusCode,
} from './types';

/**
 * ONLY full-page system/server errors.
 */

export const ERROR_CONFIG: Record<
    ErrorStatusCode,
    ErrorConfig
> = {
    403: {
        title: 'Access Denied',

        description:
            'You do not have permission to access this page.',

        color: 'purple',

        icon: ShieldAlert,

        suggestions: [
            'Contact administrator',
            'Switch account',
            'Return to dashboard',
        ],
    },

    404: {
        title: 'Page Not Found',

        description:
            'The page you are looking for could not be found.',

        color: 'blue',

        icon: SearchX,

        suggestions: [
            'Check the page URL',
            'Return to dashboard',
            'Use site navigation',
        ],
    },

    429: {
        title: 'Too Many Requests',

        description:
            'You have made too many requests. Please wait a moment and try again.',

        color: 'orange',

        icon: Clock,

        suggestions: [
            'Wait a minute before trying again',
            'Avoid rapid repeated actions',
            'Contact support if this keeps happening',
        ],

        showRetry: true,
        autoRetry: true,
    },

    500: {
        title: 'Server Error',

        description:
            'Something unexpected happened on our side.',

        color: 'red',

        icon: ServerCrash,

        suggestions: [
            'Refresh the page',
            'Try again later',
            'Contact support if issue continues',
        ],

        showRetry: true,
    },

    502: {
        title: 'Bad Gateway',

        description:
            'The server received an invalid response.',

        color: 'purple',

        icon: Ghost,

        suggestions: [
            'Try again shortly',
            'Check your internet connection',
            'The issue may be temporary',
        ],

        showRetry: true,
        autoRetry: true,
    },

    503: {
        title: 'Service Unavailable',

        description:
            'The service is temporarily unavailable.',

        color: 'orange',

        icon: ServerCrash,

        suggestions: [
            'Wait a few minutes',
            'Refresh later',
            'Try again shortly',
        ],

        showRetry: true,
        autoRetry: true,
    },

    504: {
        title: 'Gateway Timeout',

        description:
            'The server took too long to respond.',

        color: 'red',

        icon: Clock,

        suggestions: [
            'Check your internet connection',
            'Retry the request',
            'Try again later',
        ],

        showRetry: true,
        autoRetry: true,
    },
};

export const getErrorConfig = (
    status: ErrorStatusCode,
): ErrorConfig => {
    return ERROR_CONFIG[status] || ERROR_CONFIG[500];
};
