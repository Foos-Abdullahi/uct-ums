import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    DollarSign,
    Wallet,
    Check,
    X,
    CheckCircle2,
    Clock,
    ShieldCheck,
    User,
    Calendar,
    HandCoins,
    ArrowLeft,
    Receipt,
    Building2,
    BookOpen,
    RotateCcw,
    Send,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ExpenseStatusGuide } from '@/components/finance/expense-status-guide';
import { MetricCard } from '@/components/tools/MetricCard';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

interface ExpenseDetail {
    id: number;
    expense_no: string;
    title: string;
    description: string | null;
    expense_type: string;
    account_id: number | null;
    amount: number;
    expense_date: string;
    vendor: string | null;
    budget_line: string | null;
    status: string;
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    payment_method: string | null;
    payment_account_id: number | null;
    reference_no: string | null;
    paid_at: string | null;
    paymentAccount?: { id: number; code: number; name: string } | null;
    created_at: string;
    notes: string | null;
    account?: {
        id: number;
        code: number;
        name: string;
        normal_balance: string;
        category?: { type: string; name: string };
    };
    creator?: { id: number; name: string };
    approver?: { id: number; name: string };
    approvals?: Array<{
        id: number;
        level: number;
        action: string;
        comment: string | null;
        acted_at: string | null;
        approver?: { id: number; name: string };
    }>;
    level_roles?: Record<number, string>;
    canApprove?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Finance', href: '/admin/finance' },
    { title: 'Expenses', href: '/admin/expenses' },
    { title: 'Expense Details', href: '#' },
];

export default function AdminExpenseDetails({
    expense,
    payment_accounts = [],
}: {
    expense: ExpenseDetail;
    payment_accounts?: Array<{ id: number; code: number; name: string }>;
}) {
    const { t } = useTranslation();
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [approveComment, setApproveComment] = useState('');
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveProcessing, setApproveProcessing] = useState(false);
    const [statusProcessing, setStatusProcessing] = useState(false);
    const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
    const markPaidForm = useForm({
        payment_method: 'cash',
        payment_account_id: '',
        reference_no: '',
        paid_at: new Date().toISOString().split('T')[0],
    });

    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const expenseInitials = expense.title
        ? expense.title
              .split(' ')
              .filter(Boolean)
              .map((w) => w[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()
        : 'EX';

    const levelRoles = expense.level_roles ?? {};
    const approvals = expense.approvals ?? [];
    const pendingApproval = approvals.find((a) => a.action === 'pending');

    const handleApprove = () => {
        setApproveProcessing(true);
        router.post(
            `/admin/expenses/${expense.id}/approve`,
            { comment: approveComment },
            {
                onSuccess: () => {
                    toast.success('Expense approval completed.');
                    setApproveModalOpen(false);
                    setApproveComment('');
                },
                onError: (errors) => {
                    const msg = Object.values(errors)[0] ?? 'Approval failed.';
                    toast.error(String(msg));
                },
                onFinish: () => setApproveProcessing(false),
            },
        );
    };

    const handleReject = () => {
        setRejectProcessing(true);
        router.post(
            `/admin/expenses/${expense.id}/reject`,
            { comment: rejectComment },
            {
                onSuccess: () => {
                    toast.success('Expense rejected.');
                    setRejectModalOpen(false);
                    setRejectComment('');
                },
                onError: (errors) => {
                    const msg =
                        Object.values(errors)[0] ?? 'Failed to reject expense.';
                    toast.error(String(msg));
                },
                onFinish: () => setRejectProcessing(false),
            },
        );
    };

    const handleMarkPaid = () => {
        markPaidForm.reset();
        markPaidForm.setData('payment_account_id', '');
        setMarkPaidModalOpen(true);
    };

    const confirmMarkPaid = (event: React.FormEvent) => {
        event.preventDefault();
        markPaidForm.post(`/admin/expenses/${expense.id}/mark-paid`, {
            onSuccess: () => {
                toast.success('Expense marked as paid.');
                setMarkPaidModalOpen(false);
            },
            onError: (errors) => {
                const message =
                    Object.values(errors)[0] ?? 'Failed to mark as paid.';
                toast.error(String(message));
            },
        });
    };

    const handleStatusTransition = (status: 'draft' | 'pending_approval') => {
        setStatusProcessing(true);

        router.patch(
            `/admin/expenses/${expense.id}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        status === 'draft'
                            ? 'Expense returned to draft.'
                            : 'Expense submitted for approval.',
                    );
                },
                onError: (errors) => {
                    const message =
                        Object.values(errors)[0] ??
                        'Failed to update expense status.';
                    toast.error(String(message));
                },
                onFinish: () => setStatusProcessing(false),
            },
        );
    };

    const statusBadge = () => {
        const map: Record<string, React.ReactNode> = {
            paid: (
                <Badge className="border-emerald-200 bg-emerald-500/10 px-2 py-1 text-emerald-700 hover:bg-emerald-500/20">
                    <Check className="mr-1 h-3 w-3" /> Paid
                </Badge>
            ),
            approved: (
                <Badge className="border-blue-200 bg-blue-500/10 px-2 py-1 text-blue-700 hover:bg-blue-500/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
                </Badge>
            ),
            pending_approval: (
                <Badge className="border-amber-200 bg-amber-500/10 px-2 py-1 text-amber-700 hover:bg-amber-500/20">
                    <Clock className="mr-1 h-3 w-3" /> Pending Approval
                </Badge>
            ),
            rejected: (
                <Badge variant="destructive" className="px-2 py-1">
                    <X className="mr-1 h-3 w-3" /> Rejected
                </Badge>
            ),
            draft: (
                <Badge variant="outline" className="px-2 py-1">
                    Draft
                </Badge>
            ),
            cancelled: (
                <Badge variant="secondary" className="px-2 py-1">
                    Cancelled
                </Badge>
            ),
        };

        return (
            map[expense.status] ?? (
                <Badge variant="outline" className="px-2 py-1">
                    {expense.status}
                </Badge>
            )
        );
    };

    return (
        <>
            <Head title={`Expense ${expense.expense_no}`} />

            <div className="space-y-6 p-6">
                {/* Header Banner — UctPanelCard */}
                <UctPanelCard
                    type="default"
                    className="overflow-hidden"
                    title={
                        <div className="flex flex-col items-start gap-3.5 sm:flex-row sm:items-center">
                            <Avatar className="h-14 w-14 shrink-0 border-2 border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                                    {expenseInitials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-bold tracking-tight text-foreground">
                                        {expense.title}
                                    </span>
                                    <span className="rounded border border-border/60 bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                                        {expense.expense_no}
                                    </span>
                                    {statusBadge()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {expense.account ? (
                                        <>
                                            <span className="font-medium text-foreground">
                                                {expense.account.name}
                                            </span>
                                            {expense.account.code && (
                                                <> ({expense.account.code})</>
                                            )}
                                            {expense.account.category?.name
                                                ? ` • ${expense.account.category.name}`
                                                : ''}
                                            {' • '}
                                        </>
                                    ) : null}
                                    {formatDate(expense.expense_date)}
                                    {expense.vendor
                                        ? ` • Vendor: ${expense.vendor}`
                                        : ''}
                                </p>
                            </div>
                        </div>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/expenses">
                                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                    Back to Expenses
                                </Link>
                            </Button>

                            {expense.status === 'approved' && (
                                <Button
                                    size="sm"
                                    disabled={markPaidForm.processing}
                                    onClick={handleMarkPaid}
                                >
                                    <HandCoins className="mr-1.5 h-3.5 w-3.5" />
                                    {markPaidForm.processing
                                        ? 'Processing...'
                                        : 'Mark as Paid'}
                                </Button>
                            )}

                            {['draft', 'rejected', 'cancelled'].includes(
                                expense.status,
                            ) && (
                                <Button
                                    size="sm"
                                    disabled={statusProcessing}
                                    onClick={() =>
                                        handleStatusTransition(
                                            'pending_approval',
                                        )
                                    }
                                >
                                    <Send className="mr-1.5 h-3.5 w-3.5" />
                                    {expense.status === 'draft'
                                        ? t('submit_expense')
                                        : t('resubmit_expense')}
                                </Button>
                            )}

                            {expense.status === 'pending_approval' &&
                                pendingApproval && (
                                    <>
                                        <Button
                                            size="sm"
                                            disabled={statusProcessing}
                                            onClick={() =>
                                                setApproveModalOpen(true)
                                            }
                                        >
                                            <Check className="mr-1.5 h-3.5 w-3.5" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={statusProcessing}
                                            onClick={() =>
                                                setRejectModalOpen(true)
                                            }
                                        >
                                            <X className="mr-1.5 h-3.5 w-3.5" />
                                            Reject
                                        </Button>
                                    </>
                                )}
                            {expense.status === 'pending_approval' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={statusProcessing}
                                    onClick={() =>
                                        handleStatusTransition('draft')
                                    }
                                >
                                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                    {t('return_to_draft')}
                                </Button>
                            )}
                        </div>
                    }
                />

                <ExpenseStatusGuide currentStatus={expense.status} />

                {/* Info Cards */}
                <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
                    <MetricCard
                        title="Amount"
                        value={formatCurrency(expense.amount)}
                        icon={DollarSign}
                        color="destructive"
                    />
                    <MetricCard
                        title="Vendor"
                        value={expense.vendor || '—'}
                        icon={Building2}
                        color="primary"
                    />
                    <MetricCard
                        title="Account"
                        value={expense.account?.name || '—'}
                        icon={BookOpen}
                        color="accent"
                    />
                    <MetricCard
                        title="Submitted By"
                        value={
                            expense.creator?.name
                                ? expense.creator.name.replace(
                                      /^System Administrator$/i,
                                      'Sys Admin',
                                  )
                                : 'N/A'
                        }
                        icon={Calendar}
                        color="success"
                    />
                </div>

                {expense.status === 'paid' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Payment details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
                            <div>
                                <p className="text-muted-foreground">Method</p>
                                <p className="font-medium">
                                    {expense.payment_method || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Payment account
                                </p>
                                <p className="font-medium">
                                    {expense.paymentAccount?.name ||
                                        'Unassigned'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Paid date
                                </p>
                                <p className="font-medium">
                                    {expense.paid_at
                                        ? formatDate(expense.paid_at)
                                        : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">
                                    Reference
                                </p>
                                <p className="font-medium">
                                    {expense.reference_no || '—'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left: Description & Actions */}
                    <div className="space-y-6 lg:col-span-2">
                        <UctPanelCard
                            title="Expense Description"
                            description="Details of this expense voucher."
                            icon={Receipt}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                                {expense.description ||
                                    'No description provided for this expense.'}
                            </p>
                            {expense.notes && (
                                <p className="mt-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                                    Notes: {expense.notes}
                                </p>
                            )}

                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 text-xs">
                                <div>
                                    <p className="text-muted-foreground">
                                        Status
                                    </p>
                                    <p className="font-semibold text-foreground capitalize">
                                        {expense.status.replace('_', ' ')}
                                    </p>
                                </div>
                                {expense.approved_at && (
                                    <div>
                                        <p className="text-muted-foreground">
                                            Approved At
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {formatDateTime(
                                                expense.approved_at,
                                            )}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">
                                        Created At
                                    </p>
                                    <p className="font-semibold text-foreground">
                                        {formatDateTime(expense.created_at)}
                                    </p>
                                </div>
                                {expense.approver && (
                                    <div>
                                        <p className="text-muted-foreground">
                                            Final Approver
                                        </p>
                                        <p className="font-semibold text-foreground">
                                            {expense.approver.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </UctPanelCard>
                    </div>

                    {/* Right: Approval Workflow */}
                    <div className="space-y-6">
                        <UctPanelCard
                            title="Approval Workflow"
                            description="Decision history and the current approval step."
                            icon={ShieldCheck}
                        >
                            <div className="space-y-4 pt-2">
                                {Object.entries(levelRoles).length > 0 &&
                                    Object.entries(levelRoles)
                                        .sort(
                                            ([a], [b]) => Number(a) - Number(b),
                                        )
                                        .map(([level, roleName]) => {
                                            const approval = approvals.find(
                                                (a) =>
                                                    a.level === Number(level),
                                            );
                                            const isCurrent =
                                                pendingApproval?.level ===
                                                Number(level);
                                            const isDone =
                                                approval &&
                                                approval.action !== 'pending';

                                            return (
                                                <div
                                                    key={level}
                                                    className="relative"
                                                >
                                                    {Number(level) <
                                                        Object.keys(levelRoles)
                                                            .length && (
                                                        <div className="absolute top-[34px] bottom-[-6px] left-[15px] w-px bg-border" />
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`relative z-10 rounded-full p-1.5 ${
                                                                isDone
                                                                    ? approval?.action ===
                                                                      'approved'
                                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                                        : 'bg-destructive/10 text-destructive'
                                                                    : isCurrent
                                                                      ? 'bg-amber-500/10 text-amber-600'
                                                                      : 'bg-muted text-muted-foreground'
                                                            }`}
                                                        >
                                                            {approval?.action ===
                                                            'approved' ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : approval?.action ===
                                                              'rejected' ? (
                                                                <X className="h-4 w-4" />
                                                            ) : (
                                                                <User className="h-4 w-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs font-semibold text-foreground">
                                                                    Level{' '}
                                                                    {level}:{' '}
                                                                    {roleName}
                                                                </p>
                                                                {isCurrent && (
                                                                    <Badge className="bg-amber-500/10 text-[10px] text-amber-700">
                                                                        Awaiting
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                                {approval
                                                                    ?.approver
                                                                    ?.name ||
                                                                    'Unassigned'}
                                                            </p>
                                                            {approval?.comment && (
                                                                <p className="mt-1 text-[11px] text-muted-foreground italic">
                                                                    "
                                                                    {
                                                                        approval.comment
                                                                    }
                                                                    "
                                                                </p>
                                                            )}
                                                            {approval?.acted_at && (
                                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                    {
                                                                        approval.action
                                                                    }{' '}
                                                                    on{' '}
                                                                    {formatDateTime(
                                                                        approval.acted_at,
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                            </div>
                        </UctPanelCard>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link href="/admin/expenses">
                                        <Wallet className="mr-2 h-4 w-4" />
                                        All Expenses
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Approve Modal */}
                <Dialog
                    open={approveModalOpen}
                    onOpenChange={setApproveModalOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Approve Expense
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Confirm approval for {expense.expense_no}. Your
                                approval moves this expense to the next level.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="approve_comment"
                                    className="text-xs font-semibold"
                                >
                                    Comment (optional)
                                </Label>
                                <Textarea
                                    id="approve_comment"
                                    className="min-h-[80px] text-xs"
                                    placeholder="Add an optional approval note..."
                                    value={approveComment}
                                    onChange={(e) =>
                                        setApproveComment(e.target.value)
                                    }
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setApproveModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={approveProcessing}
                                    onClick={handleApprove}
                                >
                                    <Check className="mr-1.5 h-4 w-4" />
                                    {approveProcessing
                                        ? 'Approving...'
                                        : 'Approve'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Reject Modal */}
                <Dialog
                    open={rejectModalOpen}
                    onOpenChange={setRejectModalOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                Reject Expense
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Provide a reason for rejecting{' '}
                                {expense.expense_no}. Rejection requires a
                                comment.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="reject_comment"
                                    className="text-xs font-semibold"
                                >
                                    Rejection Reason{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="reject_comment"
                                    className="min-h-[90px] text-xs"
                                    placeholder="Explain why this expense is being rejected..."
                                    value={rejectComment}
                                    onChange={(e) =>
                                        setRejectComment(e.target.value)
                                    }
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRejectModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={
                                        rejectProcessing ||
                                        !rejectComment.trim()
                                    }
                                    onClick={handleReject}
                                >
                                    <X className="mr-1.5 h-4 w-4" />
                                    {rejectProcessing
                                        ? 'Rejecting...'
                                        : 'Confirm Reject'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={markPaidModalOpen}
                    onOpenChange={setMarkPaidModalOpen}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Record expense payment</DialogTitle>
                            <DialogDescription>
                                {expense.expense_no} · {expense.title}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={confirmMarkPaid} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="payment_method">
                                    Payment method
                                </Label>
                                <Select
                                    value={markPaidForm.data.payment_method}
                                    onValueChange={(value) =>
                                        markPaidForm.setData(
                                            'payment_method',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="payment_method">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">
                                            Cash
                                        </SelectItem>
                                        <SelectItem value="bank_transfer">
                                            Bank transfer
                                        </SelectItem>
                                        <SelectItem value="mobile_money">
                                            Mobile money
                                        </SelectItem>
                                        <SelectItem value="card">
                                            Card
                                        </SelectItem>
                                        <SelectItem value="cheque">
                                            Cheque
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="payment_account_id">
                                    Payment account
                                </Label>
                                <Select
                                    value={markPaidForm.data.payment_account_id}
                                    onValueChange={(value) =>
                                        markPaidForm.setData(
                                            'payment_account_id',
                                            value,
                                        )
                                    }
                                >
                                    <SelectTrigger id="payment_account_id">
                                        <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {payment_accounts.map((account) => (
                                            <SelectItem
                                                key={account.id}
                                                value={String(account.id)}
                                            >
                                                {account.code} · {account.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {markPaidForm.errors.payment_account_id && (
                                    <p className="text-xs text-destructive">
                                        {markPaidForm.errors.payment_account_id}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="paid_at">Paid date</Label>
                                    <Input
                                        id="paid_at"
                                        type="date"
                                        value={markPaidForm.data.paid_at}
                                        onChange={(event) =>
                                            markPaidForm.setData(
                                                'paid_at',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="reference_no">
                                        Reference number
                                    </Label>
                                    <Input
                                        id="reference_no"
                                        value={markPaidForm.data.reference_no}
                                        onChange={(event) =>
                                            markPaidForm.setData(
                                                'reference_no',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setMarkPaidModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        markPaidForm.processing ||
                                        !markPaidForm.data.payment_account_id
                                    }
                                >
                                    Confirm paid
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminExpenseDetails.layout = { breadcrumbs };
