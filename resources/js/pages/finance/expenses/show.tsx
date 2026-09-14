import { Head, Link, router } from '@inertiajs/react';
import {
    DollarSign,
    Receipt,
    Check,
    X,
    CheckCircle2,
    Clock,
    ShieldCheck,
    User,
    Calendar,
    ArrowLeft,
    Building2,
    HandCoins,
} from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

interface ExpenseDetail {
    id: number;
    expense_no: string;
    title: string;
    description: string | null;
    expense_type: string;
    amount: number;
    expense_date: string;
    vendor: string | null;
    budget_line: string | null;
    status: string;
    created_at: string;
    notes: string | null;
    approved_at: string | null;
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/finance/dashboard' },
    { title: 'Expenses', href: '/finance/expenses' },
    { title: 'Detail', href: '#' },
];

const TYPE_LABELS: Record<string, string> = {
    salary: 'Salary',
    utilities: 'Utilities',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    supplies: 'Supplies',
    others: 'Others',
};

export default function FinanceExpenseShow({
    expense,
    level_roles = {},
}: {
    expense: ExpenseDetail;
    level_roles?: Record<number, string>;
}) {
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [approveComment, setApproveComment] = useState('');
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveProcessing, setApproveProcessing] = useState(false);

    const formatCurrency = (val: number) =>
        `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const approvals = expense.approvals ?? [];
    const pendingApproval = approvals.find((a) => a.action === 'pending');

    const handleApprove = () => {
        setApproveProcessing(true);
        router.post(
            `/finance/expenses/${expense.id}/approve`,
            { comment: approveComment },
            {
                onSuccess: () => {
                    toast.success('Expense approved.');
                    setApproveModalOpen(false);
                    setApproveComment('');
                    setApproveProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to approve.');
                    setApproveProcessing(false);
                },
            },
        );
    };

    const handleReject = () => {
        setRejectProcessing(true);
        router.post(
            `/finance/expenses/${expense.id}/reject`,
            { comment: rejectComment },
            {
                onSuccess: () => {
                    toast.success('Expense rejected.');
                    setRejectModalOpen(false);
                    setRejectComment('');
                    setRejectProcessing(false);
                },
                onError: () => {
                    toast.error('Failed to reject.');
                    setRejectProcessing(false);
                },
            },
        );
    };

    const handleMarkPaid = () => {
        router.post(
            `/finance/expenses/${expense.id}/mark-paid`,
            {},
            {
                onSuccess: () => toast.success('Expense marked as paid.'),
                onError: () => toast.error('Failed.'),
            },
        );
    };

    const statusBadge = () => {
        const map: Record<string, React.ReactNode> = {
            paid: (
                <Badge className="border-emerald-200 bg-emerald-500/10 px-2 py-1 text-emerald-700">
                    <Check className="mr-1 h-3 w-3" /> Paid
                </Badge>
            ),
            approved: (
                <Badge className="border-blue-200 bg-blue-500/10 px-2 py-1 text-blue-700">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
                </Badge>
            ),
            pending_approval: (
                <Badge className="border-amber-200 bg-amber-500/10 px-2 py-1 text-amber-700">
                    <Clock className="mr-1 h-3 w-3" /> Pending
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                        >
                            <Link href="/finance/expenses">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                    {expense.title}
                                </h1>
                                {statusBadge()}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                <span className="font-mono font-semibold">
                                    {expense.expense_no}
                                </span>{' '}
                                ·{' '}
                                {TYPE_LABELS[expense.expense_type] ??
                                    expense.expense_type}{' '}
                                · {expense.expense_date}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {expense.status === 'approved' && (
                            <Button size="sm" onClick={handleMarkPaid}>
                                <HandCoins className="mr-1.5 h-4 w-4" /> Mark as
                                Paid
                            </Button>
                        )}
                        {expense.status === 'pending_approval' &&
                            pendingApproval && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            setApproveModalOpen(true)
                                        }
                                    >
                                        <Check className="mr-1.5 h-4 w-4" />{' '}
                                        Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setRejectModalOpen(true)}
                                    >
                                        <X className="mr-1.5 h-4 w-4" /> Reject
                                    </Button>
                                </>
                            )}
                    </div>
                </div>

                <div className="grid animate-in grid-cols-1 gap-2 duration-1000 ease-in-out fade-in slide-in-from-top-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Amount
                                    </p>
                                    <p className="text-lg font-bold text-foreground">
                                        {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-2 text-primary">
                                    <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Vendor
                                    </p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {expense.vendor || '—'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-accent/10 p-2 text-accent">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Budget Line
                                    </p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {expense.budget_line || '—'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Submitted By
                                    </p>
                                    <p className="text-sm font-semibold text-foreground">
                                        {expense.creator?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <UctPanelCard
                            title="Expense Details"
                            description="Full description and information."
                            icon={Receipt}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                                {expense.description ||
                                    'No description provided.'}
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
                                            {new Date(
                                                expense.approved_at,
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">
                                        Created
                                    </p>
                                    <p className="font-semibold text-foreground">
                                        {new Date(
                                            expense.created_at,
                                        ).toLocaleString()}
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

                    <div className="space-y-6">
                        <UctPanelCard
                            title="Approval Workflow"
                            description="Multi-level approval chain."
                            icon={ShieldCheck}
                        >
                            <div className="space-y-4 pt-2">
                                {Object.entries(level_roles)
                                    .sort(([a], [b]) => Number(a) - Number(b))
                                    .map(([level, roleName]) => {
                                        const approval = approvals.find(
                                            (a) => a.level === Number(level),
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
                                                    Object.keys(level_roles)
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
                                                                Level {level}:{' '}
                                                                {roleName}
                                                            </p>
                                                            {isCurrent && (
                                                                <Badge className="bg-amber-500/10 text-[10px] text-amber-700">
                                                                    Awaiting
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            {approval?.approver
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
                                                                {new Date(
                                                                    approval.acted_at,
                                                                ).toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </UctPanelCard>
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
                                Confirm approval for {expense.expense_no}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Comment (optional)
                                </Label>
                                <textarea
                                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    placeholder="Optional approval note..."
                                    value={approveComment}
                                    onChange={(e) =>
                                        setApproveComment(e.target.value)
                                    }
                                />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setApproveModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={approveProcessing}
                                    onClick={handleApprove}
                                >
                                    <Check className="mr-1.5 h-4 w-4" />{' '}
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
                                {expense.expense_no}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Rejection Reason{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <textarea
                                    className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:ring-1 focus:ring-ring focus:outline-none"
                                    placeholder="Explain rejection reason..."
                                    value={rejectComment}
                                    onChange={(e) =>
                                        setRejectComment(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRejectModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={
                                        rejectProcessing ||
                                        !rejectComment.trim()
                                    }
                                    onClick={handleReject}
                                >
                                    <X className="mr-1.5 h-4 w-4" />{' '}
                                    {rejectProcessing
                                        ? 'Rejecting...'
                                        : 'Confirm Reject'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

FinanceExpenseShow.layout = { breadcrumbs };
