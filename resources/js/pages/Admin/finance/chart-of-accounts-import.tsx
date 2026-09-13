import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    FileSpreadsheet,
    Loader2,
    Upload,
    XCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileUploader } from '@/components/tools/file-uploader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

export interface ImportPreviewRow {
    row: number;
    code: number | null;
    name: string;
    description: string;
    group: string;
    group_name: string;
    type: string;
    balance: string;
    errors: string[];
    warnings: string[];
}

export interface ImportPreview {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
    rows: ImportPreviewRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Chart of Accounts', href: '/admin/finance/chart-of-accounts' },
    { title: 'Import', href: '/admin/finance/chart-of-accounts/import' },
];

function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
    }

    return null;
}

const TYPE_BADGES: Record<string, React.ReactNode> = {
    asset: (
        <Badge
            variant="outline"
            className="border-sky-200 bg-sky-500/10 text-sky-700"
        >
            Asset
        </Badge>
    ),
    liability: (
        <Badge
            variant="outline"
            className="border-violet-200 bg-violet-500/10 text-violet-700"
        >
            Liability
        </Badge>
    ),
    equity: (
        <Badge
            variant="outline"
            className="border-teal-200 bg-teal-500/10 text-teal-700"
        >
            Equity
        </Badge>
    ),
    revenue: (
        <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-500/10 text-emerald-700"
        >
            Revenue
        </Badge>
    ),
    expense: (
        <Badge
            variant="outline"
            className="border-rose-200 bg-rose-500/10 text-rose-700"
        >
            Expense
        </Badge>
    ),
};

export default function AdminChartOfAccountsImport() {
    const [file, setFile] = useState<File | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [importing, setImporting] = useState(false);

    const handlePreview = async () => {
        if (!file) {
            toast.error('Please select an Excel or CSV file to import.');

            return;
        }

        setPreviewing(true);
        setPreview(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(
                '/admin/finance/chart-of-accounts/import-preview',
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
                    },
                    body: formData,
                },
            );

            if (!response.ok) {
                let message = 'Failed to read the workbook.';

                try {
                    const payload = await response.json();

                    if (payload?.errors?.file) {
                        message = Array.isArray(payload.errors.file)
                            ? payload.errors.file[0]
                            : payload.errors.file;
                    }
                } catch {
                    /* ignore */
                }

                setPreview(null);
                toast.error(message);

                return;
            }

            const data = (await response.json()) as ImportPreview;
            setPreview(data);

            if (data.errors > 0) {
                toast.error(
                    `${data.errors} row(s) have errors. Fix the workbook before importing.`,
                );
            } else {
                toast.success(
                    `Workbook parsed. ${data.valid + data.warnings} row(s) ready to import.`,
                );
            }
        } catch {
            toast.error('Import preview failed. Please try again.');
        } finally {
            setPreviewing(false);
        }
    };

    const handleImport = async () => {
        if (!preview) {
            return;
        }

        setImporting(true);

        const rowsToImport = preview.rows
            .filter((row) => row.errors.length === 0)
            .map((row) => ({
                code: row.code,
                name: row.name,
                group: row.group,
                description: row.description || null,
            }));

        try {
            const response = await fetch(
                '/admin/finance/chart-of-accounts/import',
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') ?? '',
                    },
                    body: JSON.stringify({ rows: rowsToImport }),
                },
            );

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                toast.error(
                    payload?.message ?? 'Import failed. No changes were saved.',
                );

                return;
            }

            toast.success(
                payload?.message ?? 'Accounts imported successfully.',
            );
            router.visit('/admin/finance/chart-of-accounts');
        } catch {
            toast.error('Import failed. No changes were saved.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <>
            <Head title="Import Accounts" />

            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-2 -ml-2 text-xs text-muted-foreground"
                            asChild
                        >
                            <Link href="/admin/finance/chart-of-accounts">
                                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                                Back to Chart of Accounts
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            Import Accounts
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Upload an Excel or CSV workbook, review the
                            validated rows, then import them into the chart of
                            accounts.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span
                        className={
                            preview
                                ? 'font-semibold text-emerald-600'
                                : 'font-semibold text-primary'
                        }
                    >
                        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                        1. Upload workbook
                    </span>
                    <span className="text-border">—</span>
                    <span
                        className={preview ? 'font-semibold text-primary' : ''}
                    >
                        <Upload className="mr-1 inline h-3.5 w-3.5" />
                        2. Review & validate
                    </span>
                    <span className="text-border">—</span>
                    <span>3. Import</span>
                </div>

                <div className="rounded-md border border-border/60 bg-card p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                Step 1 — Upload your workbook
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Expected columns:{' '}
                                <span className="font-mono">
                                    Code, Name, Group, Type, Normal Balance
                                </span>{' '}
                                (optional: Description, Status).
                            </p>
                        </div>
                    </div>

                    <FileUploader
                        accept={['.xlsx', '.xls', '.csv']}
                        maxSizeMB={5}
                        maxFiles={1}
                        description=".xlsx, .xls or .csv files up to 5MB"
                        onFilesChange={(files) => {
                            setFile(files[0] ?? null);
                            setPreview(null);
                        }}
                    />

                    <div className="mt-4 flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            disabled={previewing || !file}
                            onClick={handlePreview}
                        >
                            {previewing ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    Reading workbook...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                                    Review & Validate
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {preview && (
                    <div className="space-y-4 rounded-md border border-border/60 bg-card p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Step 2 — Review {preview.total} account(s)
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    No accounts are saved until you confirm the
                                    import.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className="border-emerald-200 bg-emerald-500/10 text-emerald-700"
                                >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />{' '}
                                    Valid: {preview.valid}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="border-amber-200 bg-amber-500/10 text-amber-700"
                                >
                                    <AlertCircle className="mr-1 h-3 w-3" />{' '}
                                    Warnings: {preview.warnings}
                                </Badge>
                                <Badge
                                    variant={
                                        preview.errors > 0
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                >
                                    <XCircle className="mr-1 h-3 w-3" /> Errors:{' '}
                                    {preview.errors}
                                </Badge>
                            </div>
                        </div>

                        {preview.errors > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="text-sm">
                                    Import blocked
                                </AlertTitle>
                                <AlertDescription className="text-xs">
                                    Fix the {preview.errors} row(s) with errors
                                    in the workbook, then review again.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="overflow-x-auto rounded-md border border-border/60">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/60 bg-muted/30 text-left text-[10px] tracking-wider text-muted-foreground uppercase">
                                        <th className="px-3 py-2 font-medium">
                                            Row
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Code
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Name
                                        </th>
                                        <th className="hidden px-3 py-2 font-medium md:table-cell">
                                            Group
                                        </th>
                                        <th className="hidden px-3 py-2 font-medium sm:table-cell">
                                            Type
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Result
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {preview.rows.map((row) => (
                                        <tr
                                            key={row.row}
                                            className={
                                                row.errors.length > 0
                                                    ? 'bg-destructive/5'
                                                    : ''
                                            }
                                        >
                                            <td className="px-3 py-2 text-xs text-muted-foreground">
                                                {row.row}
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs font-semibold text-foreground">
                                                {row.code ?? '—'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <p className="text-xs font-medium text-foreground">
                                                    {row.name || '—'}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {row.group_name}
                                                </p>
                                            </td>
                                            <td className="hidden px-3 py-2 text-xs text-muted-foreground capitalize md:table-cell">
                                                {row.group_name}
                                            </td>
                                            <td className="hidden px-3 py-2 sm:table-cell">
                                                {row.type ? (
                                                    TYPE_BADGES[row.type]
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2">
                                                {row.errors.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {row.errors.map(
                                                            (error, idx) => (
                                                                <p
                                                                    key={idx}
                                                                    className="text-[10px] text-destructive"
                                                                >
                                                                    {error}
                                                                </p>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : row.warnings.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {row.warnings.map(
                                                            (warning, idx) => (
                                                                <p
                                                                    key={idx}
                                                                    className="text-[10px] text-amber-700"
                                                                >
                                                                    {warning}
                                                                </p>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-medium text-emerald-600">
                                                        Ready
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {preview.errors === 0 && preview.rows.length > 0 && (
                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreview(null)}
                                >
                                    Start Over
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={importing}
                                    onClick={handleImport}
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                            Import{' '}
                                            {preview.valid + preview.warnings}{' '}
                                            account(s)
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

AdminChartOfAccountsImport.layout = { breadcrumbs };
