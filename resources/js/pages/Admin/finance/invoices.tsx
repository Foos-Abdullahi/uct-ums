import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    FileText,
    Receipt,
    DollarSign,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    Eye,
    Save,
    Percent,
    Tag,
    ListChecks,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { MetricCardsSkeleton } from '@/components/tools/metric-cards-skeleton';
import { MetricCard } from '@/components/tools/MetricCard';
import { DataTable } from '@/components/tools/table/main-table';
import type { DataTableServerFilter } from '@/components/tools/table/types';
import { TableSkeleton } from '@/components/tools/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

export interface InvoiceItem {
    id: number;
    student_id: number;
    invoice_no: string;
    title: string;
    type: string;
    amount: number;
    tax_amount: number;
    discount_amount: number;
    paid_amount: number;
    due_date: string | null;
    status: string;
    issue_date: string | null;
    created_at: string;
    items_count?: number;
    student?: {
        id: number;
        matric_no: string;
        user?: { name: string; email: string };
        program?: { name: string; code: string | null };
    };
}

export interface InvoiceStats {
    total_billed: number;
    total_paid: number;
    total_balance: number;
    total_invoices: number;
    overdue_count: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface AdminFinanceInvoicesProps {
    stats?: InvoiceStats;
    invoices?: PaginatedData<InvoiceItem>;
    students: Array<{ id: number; matric_no: string; name: string }>;
    filters: {
        search: string;
        status: string;
        type: string;
        per_page: number;
    };
}

export default function AdminFinanceInvoices({
    stats,
    invoices,
    students = [],
    filters,
}: AdminFinanceInvoicesProps) {
    const { t } = useTranslation();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedForDelete, setSelectedForDelete] =
        useState<InvoiceItem | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteProcessing, setDeleteProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('breadcrumb_dashboard'), href: '/admin/dashboard' },
        { title: t('breadcrumb_finance'), href: '/admin/finance' },
        { title: t('breadcrumb_invoices'), href: '/admin/finance/invoices' },
    ];

    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const { data, setData, post, processing, reset, errors } = useForm({
        student_id: '',
        title: 'Tuition Fee - Semester 1',
        description: '',
        type: 'tuition',
        amount: '450.00',
        tax_amount: '0',
        discount_amount: '0',
        due_date: '',
        issue_date: '',
        items: [] as Array<{
            description: string;
            quantity: string;
            unit_price: string;
            amount: string;
        }>,
    });

    const handleFilterUpdate = (newFilters: Partial<typeof filters>) => {
        const query = {
            ...filters,
            ...newFilters,
        };

        const cleanQuery: Record<string, any> = {};
        Object.entries(query).forEach(([key, val]) => {
            if (val !== undefined && val !== '' && val !== 'all') {
                cleanQuery[key] = val;
            }
        });

        router.get('/admin/finance/invoices', cleanQuery, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleCreateInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        // Compute amount from line items if they exist
        const computedAmount =
            data.items.length > 0
                ? data.items
                      .reduce((sum, it) => sum + Number(it.amount || 0), 0)
                      .toFixed(2)
                : data.amount;
        setData('amount', computedAmount);
        post('/admin/finance/invoices', {
            onSuccess: () => {
                setCreateModalOpen(false);
                reset();
            },
        });
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { description: '', quantity: '1', unit_price: '0', amount: '0' },
        ]);
    };

    const removeItem = (index: number) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const updateItemField = (index: number, field: string, value: string) => {
        const items = data.items.map((item, i) => {
            if (i !== index) {
                return item;
            }

            const updated = { ...item, [field]: value };

            if (field === 'quantity' || field === 'unit_price') {
                const qty = Number(updated.quantity || 0);
                const price = Number(updated.unit_price || 0);
                updated.amount = Number((qty * price).toFixed(2)).toString();
            }

            return updated;
        });
        setData('items', items);

        if (items.length > 0) {
            const computed = items.reduce(
                (sum, it) => sum + Number(it.amount || 0),
                0,
            );
            setData('amount', String(Number(computed.toFixed(2))));
        }
    };

    const confirmDelete = () => {
        if (!selectedForDelete) {
            return;
        }

        setDeleteProcessing(true);

        router.delete(`/admin/finance/invoices/${selectedForDelete.id}`, {
            onSuccess: () => {
                toast.success(
                    `Invoice ${selectedForDelete.invoice_no} deleted.`,
                );
                setDeleteModalOpen(false);
                setSelectedForDelete(null);
                setDeleteProcessing(false);
            },
            onError: () => {
                toast.error('Failed to delete invoice.');
                setDeleteProcessing(false);
            },
        });
    };

    const columns: ColumnDef<InvoiceItem>[] = [
        {
            accessorKey: 'invoice_no',
            header: t('invoice_no_invoices'),
            cell: ({ row }) => (
                <Badge
                    variant="outline"
                    className="font-mono text-xs font-semibold uppercase"
                >
                    {row.original.invoice_no}
                </Badge>
            ),
        },
        {
            accessorKey: 'student.user.name',
            header: t('student_name_payments'),
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <p className="truncate text-sm font-medium text-foreground">
                        {row.original.student?.user?.name || 'N/A'}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                        {row.original.student?.matric_no}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'title',
            header: t('invoice_title_invoices'),
            cell: ({ row }) => (
                <div className="max-w-[220px]">
                    <p className="truncate text-xs font-medium text-foreground">
                        {row.original.title}
                    </p>
                    <Badge
                        variant="secondary"
                        className="mt-0.5 text-[10px] capitalize"
                    >
                        {row.original.type}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'amount',
            header: t('invoice_amount_invoices'),
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-foreground">
                    {formatCurrency(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: 'paid_amount',
            header: t('paid_amount_invoices'),
            cell: ({ row }) => (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.original.paid_amount)}
                </span>
            ),
        },
        {
            id: 'balance',
            header: t('balance_invoices'),
            cell: ({ row }) => {
                const balance = Math.max(
                    0,
                    row.original.amount - row.original.paid_amount,
                );

                return (
                    <span
                        className={`text-xs font-bold ${balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                        {balance > 0 ? formatCurrency(balance) : '$0.00'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'due_date',
            header: t('due_date_invoices'),
            cell: ({ row }) => {
                const dueDate = row.original.due_date;
                const isOverdue =
                    dueDate &&
                    new Date(dueDate) < new Date() &&
                    row.original.status !== 'paid';

                return (
                    <span
                        className={`text-xs ${isOverdue ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}
                    >
                        {dueDate || t('no_due_date')}
                        {isOverdue && ` (${t('overdue')})`}
                    </span>
                );
            },
        },
        {
            accessorKey: 'status',
            header: t('status_invoices'),
            cell: ({ row }) => {
                const status = row.original.status;

                if (status === 'paid') {
                    return (
                        <Badge className="border-emerald-200 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">
                            {t('paid_invoice')}
                        </Badge>
                    );
                }

                if (status === 'partial') {
                    return (
                        <Badge className="border-amber-200 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">
                            {t('partial_paid_invoice')}
                        </Badge>
                    );
                }

                return <Badge variant="destructive">{t('unpaid_status')}</Badge>;
            },
        },
        {
            id: 'items_count',
            header: t('items'),
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-[10px]">
                    <ListChecks className="mr-1 h-3 w-3" />
                    {row.original.items_count ?? '—'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: () => <span className="sr-only">{t('actions')}</span>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        asChild
                    >
                        <Link
                            href={`/admin/finance/invoices/${row.original.id}`}
                        >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            {t('view')}
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForDelete(row.original);
                            setDeleteModalOpen(true);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    const serverFilters: DataTableServerFilter[] = [
        {
            key: 'status',
            title: t('status_invoices'),
            options: [
                { label: t('all_statuses_invoices'), value: 'all' },
                { label: t('paid_invoice'), value: 'paid' },
                { label: t('partial_paid_invoice'), value: 'partial' },
                { label: t('unpaid_status'), value: 'unpaid' },
                { label: t('overdue_invoice'), value: 'overdue' },
            ],
            value: filters.status || undefined,
        },
        {
            key: 'type',
            title: t('invoice_type_filter'),
            options: [
                { label: t('all_invoice_types'), value: 'all' },
                { label: 'Tuition', value: 'tuition' },
                { label: 'Admission', value: 'admission' },
                { label: 'Examination', value: 'examination' },
                { label: 'Laboratory', value: 'laboratory' },
                { label: 'Library', value: 'library' },
                { label: 'Graduation', value: 'graduation' },
            ],
            value: filters.type || undefined,
        },
    ];

    return (
        <>
            <Head title={t('invoices_list_page')} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            {t('invoices_list_page')}
                        </h1>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('invoices_description')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/finance/payments">{t('payments_roster')}</Link>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setCreateModalOpen(true)}
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t('create_invoice')}
                        </Button>
                    </div>
                </div>

                {/* Metric Cards */}
                <Deferred data="stats" fallback={<MetricCardsSkeleton />}>
                    {stats && (
                        <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
                            <MetricCard
                                title={t('total_invoiced')}
                                value={formatCurrency(stats.total_billed)}
                                icon={FileText}
                                color="primary"
                            />
                            <MetricCard
                                title={t('total_paid')}
                                value={formatCurrency(stats.total_paid)}
                                icon={CheckCircle2}
                                color="success"
                            />
                            <MetricCard
                                title={t('outstanding_due')}
                                value={formatCurrency(stats.total_balance)}
                                icon={DollarSign}
                                color="destructive"
                            />
                            <MetricCard
                                title={t('total_invoices')}
                                value={`${stats.total_invoices} ${t('bills')}`}
                                icon={Receipt}
                                color="accent"
                            />
                            <MetricCard
                                title={t('overdue_invoices')}
                                value={`${stats.overdue_count} ${t('bills')}`}
                                icon={AlertCircle}
                                color="destructive"
                            />
                        </div>
                    )}
                </Deferred>

                {/* Invoices Data Table */}
                <Deferred data="invoices" fallback={<TableSkeleton />}>
                    {invoices && (
                        <div className="rounded-md border border-border/60 bg-card p-4">
                            <DataTable
                                title={t('invoices_list_label')}
                                searchTitle={t('search_invoices')}
                                columns={columns}
                                data={invoices.data}
                                pagination={{
                                    current_page: invoices.current_page,
                                    last_page: invoices.last_page,
                                    per_page: invoices.per_page,
                                    total: invoices.total,
                                }}
                                onPageChange={(page) =>
                                    handleFilterUpdate({
                                        ...filters,
                                        page,
                                    } as any)
                                }
                                onPageSizeChange={(per_page) =>
                                    handleFilterUpdate({
                                        per_page,
                                        page: 1,
                                    } as any)
                                }
                                serverFilters={serverFilters}
                                onServerFilterChange={(key, values) => {
                                    handleFilterUpdate({
                                        [key]: values?.[0] ?? 'all',
                                    });
                                }}
                                onServerFilterClear={() => {
                                    router.get(
                                        '/admin/finance/invoices',
                                        {},
                                        { preserveState: true },
                                    );
                                }}
                                onRowClick={(row) =>
                                    router.visit(
                                        `/admin/students/${row.original.student_id}?tab=finance`,
                                    )
                                }
                            />
                        </div>
                    )}
                </Deferred>

                {/* Issue Invoice Modal */}
                <Dialog
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                {t('issue_student_invoice')}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {t('create_invoice_description')}
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={handleCreateInvoice}
                            className="space-y-4 py-2"
                        >
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="student_id"
                                    className="text-xs font-semibold"
                                >
                                    {t('student')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <select
                                    id="student_id"
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    value={data.student_id}
                                    onChange={(e) =>
                                        setData('student_id', e.target.value)
                                    }
                                    required
                                >
                                    <option value="">{t('select_student')}</option>
                                    {students.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.matric_no})
                                        </option>
                                    ))}
                                </select>
                                {errors.student_id && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.student_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="title"
                                    className="text-xs font-semibold"
                                >
                                    {t('invoice_title')}{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Tuition Fee - Fall 2026 Semester 1"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    className="text-xs"
                                    required
                                />
                                {errors.title && (
                                    <p className="text-[11px] text-destructive">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="type"
                                        className="text-xs font-semibold"
                                    >
                                        {t('fee_category')}{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <select
                                        id="type"
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                        value={data.type}
                                        onChange={(e) =>
                                            setData('type', e.target.value)
                                        }
                                        required
                                    >
                                        <option value="tuition">Tuition</option>
                                        <option value="admission">
                                            Admission
                                        </option>
                                        <option value="examination">
                                            Examination
                                        </option>
                                        <option value="laboratory">
                                            Laboratory
                                        </option>
                                        <option value="library">Library</option>
                                        <option value="graduation">
                                            Graduation
                                        </option>
                                        <option value="hostel">Hostel</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="amount"
                                        className="text-xs font-semibold"
                                    >
                                        {t('amount')} ($){' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="450.00"
                                        value={data.amount}
                                        onChange={(e) =>
                                            setData('amount', e.target.value)
                                        }
                                        className="text-xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="tax_amount"
                                        className="text-xs font-semibold"
                                    >
                                        <Percent className="mr-1 inline h-3 w-3" />{' '}
                                        Tax ($)
                                    </Label>
                                    <Input
                                        id="tax_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={data.tax_amount}
                                        onChange={(e) =>
                                            setData(
                                                'tax_amount',
                                                e.target.value,
                                            )
                                        }
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="discount_amount"
                                        className="text-xs font-semibold"
                                    >
                                        <Tag className="mr-1 inline h-3 w-3" />{' '}
                                        Discount ($)
                                    </Label>
                                    <Input
                                        id="discount_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={data.discount_amount}
                                        onChange={(e) =>
                                            setData(
                                                'discount_amount',
                                                e.target.value,
                                            )
                                        }
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="due_date"
                                        className="text-xs font-semibold"
                                    >
                                        {t('due_date')}
                                    </Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) =>
                                            setData('due_date', e.target.value)
                                        }
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            {/* Line Items Section */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-muted-foreground">
                                        <ListChecks className="mr-1 inline h-3.5 w-3.5" />
                                        {t('line_items')}
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={addItem}
                                    >
                                        <Plus className="mr-1 h-3 w-3" />
                                        {t('add_item')}
                                    </Button>
                                </div>
                                {data.items.length === 0 && (
                                    <p className="py-2 text-[11px] text-muted-foreground italic">
                                        {t('add_line_items_description')}
                                    </p>
                                )}
                                {data.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[1fr_50px_70px_70px_28px] items-center gap-1.5"
                                    >
                                        <Input
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) =>
                                                updateItemField(
                                                    index,
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            className="text-xs"
                                        />
                                        <Input
                                            placeholder="Qty"
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateItemField(
                                                    index,
                                                    'quantity',
                                                    e.target.value,
                                                )
                                            }
                                            className="text-xs"
                                        />
                                        <Input
                                            placeholder="Unit $"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={item.unit_price}
                                            onChange={(e) =>
                                                updateItemField(
                                                    index,
                                                    'unit_price',
                                                    e.target.value,
                                                )
                                            }
                                            className="text-xs"
                                        />
                                        <Input
                                            placeholder="Total"
                                            type="number"
                                            step="0.01"
                                            value={item.amount}
                                            onChange={(e) =>
                                                updateItemField(
                                                    index,
                                                    'amount',
                                                    e.target.value,
                                                )
                                            }
                                            className="text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-1 text-destructive hover:text-destructive"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {data.items.length > 0 && (
                                    <p className="border-t border-border/30 pt-1 text-right text-[11px] text-muted-foreground">
                                        {t('computed_amount')}: $
                                        {data.items
                                            .reduce(
                                                (sum, it) =>
                                                    sum +
                                                    Number(it.amount || 0),
                                                0,
                                            )
                                            .toFixed(2)}
                                    </p>
                                )}
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCreateModalOpen(false)}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing}
                                >
                                    <Save className="mr-1.5 h-4 w-4" />
                                    {processing ? t('saving') : t('issue_invoice')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <ConfirmDeleteDialog
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title={t('delete_invoice')}
                    description={t('delete_invoice_description')}
                    itemName={
                        selectedForDelete
                            ? `${selectedForDelete.invoice_no} (${selectedForDelete.title})`
                            : undefined
                    }
                    loading={deleteProcessing}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}

AdminFinanceInvoices.layout = { breadcrumbs: [{ title: 'breadcrumb_dashboard', href: '/admin/dashboard' }, { title: 'breadcrumb_finance', href: '/admin/finance' }, { title: 'breadcrumb_invoices', href: '/admin/finance/invoices' }] };
