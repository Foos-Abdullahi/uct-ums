import { Head, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Home, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { getErrorConfig } from './error-config';
import type { ErrorPageProps, ErrorStatusCode } from './types';

interface PageProps extends ErrorPageProps {
    auth?: {
        user?: unknown;
    };
}

export default function ErrorPage() {
    const { status, message, requestId, debug, auth } = usePage<PageProps>().props;
    const safeStatus = (status ?? 500) as ErrorStatusCode;
    const config = getErrorConfig(safeStatus);
    const displayMessage = message ?? config.description;

    const cardContent = (
        <Card className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-background/95 shadow-md backdrop-blur-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

            <CardContent className="p-6 text-center sm:p-8">
                <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Error {safeStatus}
                </div>

                <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-6xl font-bold tracking-tight text-transparent">
                    {safeStatus}
                </h1>

                <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {config.title}
                </h2>

                <p className="mt-3 text-sm break-words text-muted-foreground">
                    {displayMessage}
                </p>

                {requestId && (
                    <p className="mt-3 text-xs text-muted-foreground">
                        Reference:{' '}
                        <span className="font-mono">{requestId}</span>
                    </p>
                )}

                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
                        <Lightbulb className="h-3.5 w-3.5" />
                        Suggestions
                    </div>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {config.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1 text-primary">•</span>
                                <span>{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {debug && (
                    <details className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-left">
                        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-destructive">
                            Debug details (local only)
                        </summary>
                        <pre className="mt-3 max-h-48 overflow-auto text-left text-xs text-muted-foreground whitespace-pre-wrap">
                            {debug.message}
                            {'\n'}
                            {debug.file}:{debug.line}
                            {'\n\n'}
                            {debug.trace?.join('\n')}
                        </pre>
                    </details>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button
                        onClick={() => router.visit('/dashboard')}
                        className="w-full sm:w-auto"
                        size="default"
                    >
                        <Home className="mr-2 h-4 w-4" />
                        Go to Dashboard
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto"
                        size="default"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    if (auth?.user) {
        return (
            <>
                <Head title={`${safeStatus} - ${config.title}`} />
                <AppLayout breadcrumbs={[{ title: `Error ${safeStatus}`, href: '#' }]}>
                    <div className="relative flex min-h-[calc(100vh-12rem)] items-center justify-center overflow-hidden px-6 py-10">
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
                            <div className="absolute bottom-[-140px] right-[-140px] h-[360px] w-[360px] rounded-full bg-secondary/10 blur-3xl" />
                        </div>
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.04)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

                        {cardContent}
                    </div>
                </AppLayout>
            </>
        );
    }

    return (
        <>
            <Head title={`${safeStatus} - ${config.title}`} />
            <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-secondary/5 px-6 py-10">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute bottom-[-140px] right-[-140px] h-[360px] w-[360px] rounded-full bg-secondary/20 blur-3xl" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.08)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

                {cardContent}
            </div>
        </>
    );
}
