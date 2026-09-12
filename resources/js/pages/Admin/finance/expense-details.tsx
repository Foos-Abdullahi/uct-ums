import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
import { MetricCard } from '@/components/tools/MetricCard';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
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
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function AdminExpenseDetails({ expense }: { expense: ExpenseDetail }) {
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [approveComment, setApproveComment] = useState('');
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveProcessing, setApproveProcessing] = useState(false);
    const [markPaidProcessing, setMarkPaidProcessing] = useState(false);

    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                    toast.success('Expense approved at this level.');
                    setApproveModalOpen(false);
                    setApproveComment('');
                    setApproveProcessing(false);
                },
                onError: (errors) => {
                    const msg = Object.values(errors)[0] ?? 'Approval failed.';
                    toast.error(String(msg));
                    setApproveProcessing(false);
                },
            }
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
                    setRejectProcessing(false);
                },
                onError: (errors) => {
                    const msg = Object.values(errors)[0] ?? 'Failed to reject expense.';
                    toast.error(String(msg));
                    setRejectProcessing(false);
                },
            }
        );
    };

    const handleMarkPaid = () => {
        setMarkPaidProcessing(true);
        router.post(`/admin/expenses/${expense.id}/mark-paid`, {}, {
            onSuccess: () => {
                toast.success('Expense marked as paid.');
                setMarkPaidProcessing(false);
            },
            onError: () => {
                toast.error('Failed to mark as paid.');
                setMarkPaidProcessing(false);
            },
        });
    };

    const statusBadge = () => {
        const map: Record<string, React.ReactNode> = {
            paid: (
                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200 px-2 py-1">
                    <Check className="h-3 w-3 mr-1" /> Paid
                </Badge>
            ),
            approved: (
                <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200 px-2 py-1">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                </Badge>
            ),
            pending_approval: (
                <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200 px-2 py-1">
                    <Clock className="h-3 w-3 mr-1" /> Pending Approval
                </Badge>
            ),
            rejected: (
                <Badge variant="destructive" className="px-2 py-1">
                    <X className="h-3 w-3 mr-1" /> Rejected
                </Badge>
            ),
            draft: (
                <Badge variant="outline" className="px-2 py-1">Draft</Badge>
            ),
            cancelled: (
                <Badge variant="secondary" className="px-2 py-1">Cancelled</Badge>
            ),
        };
        return map[expense.status] ?? <Badge variant="outline" className="px-2 py-1">{expense.status}</Badge>;
    };

    return (
        <>
            <Head title={`Expense ${expense.expense_no}`} />

            <div className="p-6 space-y-6">
                {/* Header Banner — UctPanelCard */}
                <UctPanelCard
                    type="default"
                    className="overflow-hidden"
                    title={
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                            <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
                                    {expenseInitials}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-bold text-foreground tracking-tight">
                                        {expense.title}
                                    </span>
                                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border/60">
                                        {expense.expense_no}
                                    </span>
                                    {statusBadge()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {expense.account ? (
                                        <>
                                            <span className="font-medium text-foreground">{expense.account.name}</span>
                                            {expense.account.code && (
                                                <> ({expense.account.code})</>
                                            )}
                                            {expense.account.category?.name ? ` • ${expense.account.category.name}` : ''}
                                            {' • '}
                                        </>
                                    ) : null}
                                    {formatDate(expense.expense_date)}
                                    {expense.vendor ? ` • Vendor: ${expense.vendor}` : ''}
                                </p>
                            </div>
                        </div>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/expenses">
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                    Back to Expenses
                                </Link>
                            </Button>

                            {expense.status === 'approved' && (
                                <Button size="sm" disabled={markPaidProcessing} onClick={handleMarkPaid}>
                                    <HandCoins className="h-3.5 w-3.5 mr-1.5" />
                                    {markPaidProcessing ? 'Processing...' : 'Mark as Paid'}
                                </Button>
                            )}

                            {expense.status === 'pending_approval' && pendingApproval && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => setApproveModalOpen(true)}
                                    >
                                        <Check className="h-3.5 w-3.5 mr-1.5" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setRejectModalOpen(true)}
                                    >
                                        <X className="h-3.5 w-3.5 mr-1.5" />
                                        Reject
                                    </Button>
                                </>
                            )}
                        </div>
                    }
                />

                {/* Info Cards */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
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
                        value={expense.creator?.name ? expense.creator.name.replace(/^System Administrator$/i, 'Sys Admin') : 'N/A'}
                        icon={Calendar}
                        color="success"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Description & Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        <UctPanelCard
                            title="Expense Description"
                            description="Details of this expense voucher."
                            icon={Receipt}
                        >
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {expense.description || 'No description provided for this expense.'}
                            </p>
                            {expense.notes && (
                                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
                                    Notes: {expense.notes}
                                </p>
                            )}

                            <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <p className="font-semibold text-foreground capitalize">{expense.status.replace('_', ' ')}</p>
                                </div>
                                {expense.approved_at && (
                                    <div>
                                        <p className="text-muted-foreground">Approved At</p>
                                        <p className="font-semibold text-foreground">{formatDateTime(expense.approved_at)}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">Created At</p>
                                    <p className="font-semibold text-foreground">{formatDateTime(expense.created_at)}</p>
                                </div>
                                {expense.approver && (
                                    <div>
                                        <p className="text-muted-foreground">Final Approver</p>
                                        <p className="font-semibold text-foreground">{expense.approver.name}</p>
                                    </div>
                                )}
                            </div>
                        </UctPanelCard>
                    </div>

                    {/* Right: Approval Workflow */}
                    <div className="space-y-6">
                        <UctPanelCard
                            title="Approval Workflow"
                            description="Multi-level approval chain."
                            icon={ShieldCheck}
                        >
                            <div className="space-y-4 pt-2">
                                {Object.entries(levelRoles).length > 0 &&
                                    Object.entries(levelRoles)
                                        .sort(([a], [b]) => Number(a) - Number(b))
                                        .map(([level, roleName]) => {
                                            const approval = approvals.find(
                                                (a) => a.level === Number(level)
                                            );
                                            const isCurrent = pendingApproval?.level === Number(level);
                                            const isDone = approval && approval.action !== 'pending';

                                            return (
                                                <div key={level} className="relative">
                                                    {Number(level) < Object.keys(levelRoles).length && (
                                                        <div className="absolute left-[15px] top-[34px] bottom-[-6px] w-px bg-border" />
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <div className={`relative z-10 rounded-full p-1.5 ${
                                                            isDone
                                                                ? approval?.action === 'approved'
                                                                    ? 'bg-emerald-500/10 text-emerald-600'
                                                                    : 'bg-destructive/10 text-destructive'
                                                                : isCurrent
                                                                ? 'bg-amber-500/10 text-amber-600'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {approval?.action === 'approved' ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : approval?.action === 'rejected' ? (
                                                                <X className="h-4 w-4" />
                                                            ) : (
                                                                <User className="h-4 w-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs font-semibold text-foreground">
                                                                    Level {level}: {roleName}
                                                                </p>
                                                                {isCurrent && (
                                                                    <Badge className="bg-amber-500/10 text-amber-700 text-[10px]">
                                                                        Awaiting
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                                {approval?.approver?.name || 'Unassigned'}
                                                            </p>
                                                            {approval?.comment && (
                                                                <p className="text-[11px] text-muted-foreground mt-1 italic">
                                                                    "{approval.comment}"
                                                                </p>
                                                            )}
                                                            {approval?.acted_at && (
                                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                    {approval.action} on {formatDateTime(approval.acted_at)}
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
                                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                                    <Link href="/admin/expenses">
                                        <Wallet className="h-4 w-4 mr-2" />
                                        All Expenses
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Approve Modal */}
                <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Approve Expense</DialogTitle>
                            <DialogDescription className="text-xs">
                                Confirm approval for {expense.expense_no}. Your approval moves this expense to the next level.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="approve_comment" className="text-xs font-semibold">
                                    Comment (optional)
                                </Label>
                                <Textarea
                                    id="approve_comment"
                                    className="min-h-[80px] text-xs"
                                    placeholder="Add an optional approval note..."
                                    value={approveComment}
                                    onChange={(e) => setApproveComment(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setApproveModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="button" size="sm" disabled={approveProcessing} onClick={handleApprove}>
                                    <Check className="h-4 w-4 mr-1.5" />
                                    {approveProcessing ? 'Approving...' : 'Approve'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Reject Modal */}
                <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Reject Expense</DialogTitle>
                            <DialogDescription className="text-xs">
                                Provide a reason for rejecting {expense.expense_no}. Rejection requires a comment.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="reject_comment" className="text-xs font-semibold">
                                    Rejection Reason <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="reject_comment"
                                    className="min-h-[90px] text-xs"
                                    placeholder="Explain why this expense is being rejected..."
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={rejectProcessing || !rejectComment.trim()}
                                    onClick={handleReject}
                                >
                                    <X className="h-4 w-4 mr-1.5" />
                                    {rejectProcessing ? 'Rejecting...' : 'Confirm Reject'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminExpenseDetails.layout = { breadcrumbs };