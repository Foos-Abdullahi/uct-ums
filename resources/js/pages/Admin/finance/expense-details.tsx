import React, { useState } from 'react';
import { Deferred, Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UctPanelCard } from '@/components/tools/uct-panel-card';
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
} from 'lucide-react';
import { toast } from 'sonner';

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
    created_by: number;
    approved_by: number | null;
    approved_at: string | null;
    created_at: string;
    notes: string | null;
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

const TYPE_LABELS: Record<string, string> = {
    salary: 'Salary',
    utilities: 'Utilities',
    equipment: 'Equipment',
    maintenance: 'Maintenance',
    supplies: 'Supplies',
    others: 'Others',
};

export default function AdminExpenseDetails({ expense }: { expense: ExpenseDetail }) {
    const [rejectComment, setRejectComment] = useState('');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectProcessing, setRejectProcessing] = useState(false);
    const [approveComment, setApproveComment] = useState('');
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approveProcessing, setApproveProcessing] = useState(false);
    const [markPaidProcessing, setMarkPaidProcessing] = useState(false);

    const formatCurrency = (val: number) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
                onError: () => {
                    toast.error('Approval failed.');
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
                onError: () => {
                    toast.error('Failed to reject expense.');
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
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href="/admin/expenses">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                                    {expense.title}
                                </h1>
                                {statusBadge()}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="font-mono font-semibold">{expense.expense_no}</span> · {TYPE_LABELS[expense.expense_type] ?? expense.expense_type} · {expense.expense_date}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {expense.status === 'approved' && (
                            <Button size="sm" disabled={markPaidProcessing} onClick={handleMarkPaid}>
                                <HandCoins className="h-4 w-4 mr-1.5" />
                                {markPaidProcessing ? 'Processing...' : 'Mark as Paid'}
                            </Button>
                        )}
                        {expense.status === 'pending_approval' && pendingApproval && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => setApproveModalOpen(true)}
                                >
                                    <Check className="h-4 w-4 mr-1.5" />
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setRejectModalOpen(true)}
                                >
                                    <X className="h-4 w-4 mr-1.5" />
                                    Reject
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 animate-in fade-in slide-in-from-top-6 duration-1000 ease-in-out">
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="text-lg font-bold text-foreground">{formatCurrency(expense.amount)}</p>
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
                                    <p className="text-xs text-muted-foreground">Vendor</p>
                                    <p className="text-sm font-semibold text-foreground">{expense.vendor || '—'}</p>
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
                                    <p className="text-xs text-muted-foreground">Budget Line</p>
                                    <p className="text-sm font-semibold text-foreground">{expense.budget_line || '—'}</p>
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
                                    <p className="text-xs text-muted-foreground">Submitted By</p>
                                    <p className="text-sm font-semibold text-foreground">{expense.creator?.name || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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
                                        <p className="font-semibold text-foreground">{new Date(expense.approved_at).toLocaleString()}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">Created At</p>
                                    <p className="font-semibold text-foreground">{new Date(expense.created_at).toLocaleString()}</p>
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
                                                                    {approval.action} on {new Date(approval.acted_at).toLocaleString()}
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
                                <textarea
                                    id="approve_comment"
                                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                                <textarea
                                    id="reject_comment"
                                    className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Explain why this expense is being rejected..."
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    required
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