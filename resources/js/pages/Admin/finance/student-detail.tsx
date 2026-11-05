import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    ChevronDown,
    CreditCard,
    Eye,
    Plus,
    Printer,
    Receipt,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import StudentStatementSheet, {
    formatMoney,
} from '@/components/finance/student-statement-sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FinanceStatementData, Student, StudentInvoice } from '@/types/student';
import { ManageFeeModal } from '../students/components/manage-fee-modal';
import { RecordPaymentModal } from '../students/components/record-payment-modal';
import { StudentFeeBadge } from '../students/components/student-fee-badge';
import { StudentStatusBadge } from '../students/components/student-status-badge';

interface InvoiceRow {
    id: number;
    invoice_no: string;
    title: string;
    type: string;
    amount: number;
    paid_amount: number;
    due_date: string | null;
    status: string;
}

interface PaymentRow {
    id: number;
    transaction_no: string;
    amount: number;
    payment_method: string;
    payment_date: string | null;
    status: string;
    notes: string | null;
    invoice_no: string | null;
}

interface SemesterGroup {
    key: string;
    label: string;
    academic_year: string | null;
    semester: number | null;
    is_current: boolean;
    charged: number;
    paid: number;
    balance: number;
    status: string;
    overdue_count: number;
    invoices: InvoiceRow[];
    payments: PaymentRow[];
}

interface Props {
    student: Pick<
        Student,
        | 'id'
        | 'matric_no'
        | 'academic_year'
        | 'current_semester'
        | 'enrollment_status'
        | 'fee_status'
        | 'photo_url'
    > & {
        user: { name: string; email: string } | null;
        program: { name: string } | null;
    };
    summary: {
        total_invoiced: number;
        total_paid: number;
        total_outstanding: number;
        pending_payments: number;
        overdue_count: number;
    };
    semesters: SemesterGroup[];
    unallocatedPayments: PaymentRow[];
    financeStatement: FinanceStatementData;
    openInvoices: { id: number; invoice_no: string; title: string; amount: number; paid_amount: number }[];
}

const money = formatMoney;

function SemesterStatus({ status }: { status: string }) {
    if (status === 'none') {
        return <Badge variant="secondary">No fees issued</Badge>;
    }

    return <StudentFeeBadge status={status === 'paid' ? 'paid' : status} />;
}

function PaymentStatus({ status }: { status: string }) {
    const styles: Record<string, string> = {
        paid: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
        rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
        pending: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
    };

    return (
        <Badge variant="outline" className={`capitalize ${styles[status] ?? ''}`}>
            {status}
        </Badge>
    );
}

export default function AdminFinanceStudentDetail({
    student,
    summary,
    semesters,
    unallocatedPayments,
    financeStatement,
    openInvoices,
}: Props) {
    const [feeOpen, setFeeOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [feeTarget, setFeeTarget] = useState<{
        semester: number;
        academicYear: string | null;
    } | null>(null);
    const [busy, setBusy] = useState<number | null>(null);

    const name = student.user?.name ?? 'Unknown Student';
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const current = semesters.find((s) => s.is_current);
    const past = semesters.filter((s) => !s.is_current);

    const changePaymentStatus = (id: number, status: 'paid' | 'rejected') => {
        setBusy(id);
        router.patch(
            `/admin/students/${student.id}/payments/${id}/status`,
            { status },
            {
                preserveScroll: true,
                onSuccess: () => toast.success(`Payment ${status}.`),
                onError: () => toast.error('Failed to update payment.'),
                onFinish: () => setBusy(null),
            },
        );
    };

    const renderSemester = (group: SemesterGroup) => (
        <div className="space-y-4">
            {group.semester !== null && (
                <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8">
                        <a
                            href={`/admin/students/${student.id}/finance-statement?semester=${group.semester}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                            Print semester {group.semester}
                        </a>
                    </Button>
                    <Button
                        size="sm"
                        className="h-8"
                        onClick={() =>
                            setFeeTarget({
                                semester: group.semester as number,
                                academicYear:
                                    group.academic_year ??
                                    student.academic_year ??
                                    null,
                            })
                        }
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add fee record
                    </Button>
                </div>
            )}
            {group.invoices.length === 0 ? (
                <div className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                    No fee records for this semester yet — use “Add fee record”
                    to create one.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                        <thead className="bg-muted/40 text-left text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 font-medium">Invoice</th>
                                <th className="px-3 py-2 font-medium">Fee</th>
                                <th className="px-3 py-2 text-right font-medium">Amount</th>
                                <th className="px-3 py-2 text-right font-medium">Paid</th>
                                <th className="px-3 py-2 text-right font-medium">Balance</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {group.invoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td className="px-3 py-2 font-mono font-semibold">
                                        {inv.invoice_no}
                                    </td>
                                    <td className="px-3 py-2">
                                        {inv.title}
                                        <span className="ml-1.5 text-[10px] text-muted-foreground capitalize">
                                            {inv.type}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {money(inv.amount)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-emerald-600 tabular-nums">
                                        {money(inv.paid_amount)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                                        {money(Math.max(0, inv.amount - inv.paid_amount))}
                                    </td>
                                    <td className="px-3 py-2">
                                        <StudentFeeBadge status={inv.status} />
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                            <Link href={`/admin/finance/invoices/${inv.id}`}>
                                                <Eye className="mr-1 h-3.5 w-3.5" />
                                                View
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {group.payments.length > 0 && (
                <div>
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase">
                        Payments
                    </p>
                    {renderPayments(group.payments)}
                </div>
            )}
        </div>
    );

    const renderPayments = (payments: PaymentRow[]) => (
        <ul className="divide-y rounded-md border text-xs">
            {payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                    <span className="font-mono font-semibold">{p.transaction_no}</span>
                    <span className="text-muted-foreground">
                        {p.payment_date ?? '—'} · {p.payment_method.replace('_', ' ')}
                        {p.invoice_no ? ` · ${p.invoice_no}` : ''}
                    </span>
                    <span className="ml-auto font-semibold tabular-nums">{money(p.amount)}</span>
                    <PaymentStatus status={p.status} />
                    {p.status === 'pending' && (
                        <span className="flex gap-1">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[11px] text-emerald-600"
                                disabled={busy === p.id}
                                onClick={() => changePaymentStatus(p.id, 'paid')}
                            >
                                <Check className="mr-1 h-3 w-3" />
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[11px] text-destructive"
                                disabled={busy === p.id}
                                onClick={() => changePaymentStatus(p.id, 'rejected')}
                            >
                                <X className="mr-1 h-3 w-3" />
                                Reject
                            </Button>
                        </span>
                    )}
                </li>
            ))}
        </ul>
    );

    const groupTitle = (g: SemesterGroup) =>
        g.semester === null ? g.label : `${g.label} · ${g.academic_year ?? 'Unknown year'}`;

    return (
        <>
            <Head title={`Finance - ${name}`} />

            <div className="space-y-6 p-6">
                <Link
                    href="/admin/finance/students"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Search another student
                </Link>

                {/* Student header */}
                <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={student.photo_url ?? undefined} alt={name} />
                        <AvatarFallback className="bg-primary/10 font-bold text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg font-bold tracking-tight">{name}</h1>
                            <span className="rounded border bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                                {student.matric_no}
                            </span>
                            <StudentStatusBadge status={student.enrollment_status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {student.program?.name ?? 'No program assigned'} · Now in{' '}
                            <strong className="text-foreground">
                                Semester {student.current_semester}
                            </strong>
                            {student.academic_year ? ` (${student.academic_year})` : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/students/${student.id}`}>
                                <User className="mr-1.5 h-3.5 w-3.5" />
                                Profile
                            </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/students/${student.id}/finance-statement`}>
                                <Printer className="mr-1.5 h-3.5 w-3.5" />
                                Print
                            </Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setFeeOpen(true)}>
                            <Receipt className="mr-1.5 h-3.5 w-3.5" />
                            Issue Invoice
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={() => setPaymentOpen(true)}
                            disabled={openInvoices.length === 0}
                        >
                            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                            Record Payment
                        </Button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        { label: 'Total invoiced', value: money(summary.total_invoiced), tone: '' },
                        { label: 'Total paid', value: money(summary.total_paid), tone: 'text-emerald-600' },
                        {
                            label: 'Outstanding',
                            value: money(summary.total_outstanding),
                            tone: summary.total_outstanding > 0 ? 'text-destructive' : 'text-emerald-600',
                        },
                        {
                            label: 'Needs attention',
                            value: `${summary.overdue_count} overdue · ${summary.pending_payments} pending`,
                            tone: summary.overdue_count > 0 ? 'text-destructive' : '',
                            small: true,
                        },
                    ].map((card) => (
                        <div key={card.label} className="rounded-lg border bg-card p-4">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                {card.label}
                            </p>
                            <p
                                className={`mt-1 font-bold tabular-nums ${card.small ? 'text-sm' : 'text-xl'} ${card.tone}`}
                            >
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                <Tabs defaultValue="semesters" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="semesters" className="text-xs">
                            By semester
                        </TabsTrigger>
                        <TabsTrigger value="ledger" className="text-xs">
                            Full ledger
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="semesters" className="space-y-5">
                        {current && (
                            <section className="space-y-3 rounded-lg border-2 border-primary/30 bg-card p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <Badge className="mb-1">Current semester</Badge>
                                        <h2 className="text-base font-bold">{groupTitle(current)}</h2>
                                    </div>
                                    <div className="flex items-center gap-4 text-right text-xs">
                                        <div>
                                            <p className="text-muted-foreground">Charged</p>
                                            <p className="font-bold tabular-nums">{money(current.charged)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Paid</p>
                                            <p className="font-bold text-emerald-600 tabular-nums">
                                                {money(current.paid)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Balance</p>
                                            <p
                                                className={`font-bold tabular-nums ${current.balance > 0 ? 'text-destructive' : ''}`}
                                            >
                                                {money(current.balance)}
                                            </p>
                                        </div>
                                        <SemesterStatus status={current.status} />
                                    </div>
                                </div>
                                {renderSemester(current)}
                            </section>
                        )}

                        <div className="space-y-2">
                            <h2 className="text-sm font-semibold">Past semesters</h2>
                            {past.length === 0 && (
                                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
                                    No earlier semester records for this student.
                                </p>
                            )}
                            {past.map((g) => (
                                <Collapsible key={g.key} className="rounded-lg border bg-card">
                                    <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3 text-left">
                                        <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                                        <span className="flex-1 text-sm font-semibold">
                                            {groupTitle(g)}
                                        </span>
                                        <span className="hidden text-xs text-muted-foreground sm:inline">
                                            {g.status === 'none' ? 'No records' : `${money(g.paid)} / ${money(g.charged)}`}
                                        </span>
                                        <span
                                            className={`text-xs font-bold tabular-nums ${g.balance > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                                        >
                                            {g.balance > 0 ? `${money(g.balance)} due` : g.status === 'none' ? '—' : 'Settled'}
                                        </span>
                                        <SemesterStatus status={g.status} />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="border-t p-4">
                                        {renderSemester(g)}
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>

                        {unallocatedPayments.length > 0 && (
                            <section className="space-y-2">
                                <h2 className="text-sm font-semibold">
                                    Payments not linked to an invoice
                                </h2>
                                {renderPayments(unallocatedPayments)}
                            </section>
                        )}
                    </TabsContent>

                    <TabsContent value="ledger">
                        <StudentStatementSheet
                            student={student as unknown as Student}
                            statement={financeStatement.statement}
                            totals={financeStatement.totals}
                            generatedAt={financeStatement.generatedAt}
                            printUrl={`/admin/students/${student.id}/finance-statement`}
                        />
                    </TabsContent>
                </Tabs>

                <ManageFeeModal
                    key={feeTarget ? feeTarget.semester : 'current'}
                    open={feeOpen || feeTarget !== null}
                    onOpenChange={(open) => {
                        setFeeOpen(open);

                        if (!open) {
                            setFeeTarget(null);
                        }
                    }}
                    studentId={student.id}
                    academicYear={
                        feeTarget?.academicYear ?? student.academic_year ?? null
                    }
                    semester={
                        feeTarget?.semester ?? student.current_semester ?? 1
                    }
                />
                <RecordPaymentModal
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    studentId={student.id}
                    invoices={openInvoices as unknown as StudentInvoice[]}
                />
            </div>
        </>
    );
}

AdminFinanceStudentDetail.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Finance', href: '/admin/finance' },
        { title: 'Student Finance', href: '/admin/finance/students' },
    ],
};
