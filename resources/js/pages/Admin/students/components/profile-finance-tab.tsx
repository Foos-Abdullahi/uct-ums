import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FinanceStatementData, Student } from '@/types/student';
import { formatMoney, SectionCard, StatTile } from './profile-shared';
import type {
    CurrentSemesterFinance,
    FinancialSummary,
} from './profile-shared';
import { StudentFeeBadge } from './student-fee-badge';

interface Props {
    student: Student;
    financialSummary: FinancialSummary;
    currentSemesterFinance: CurrentSemesterFinance | null;
    financeStatement?: FinanceStatementData;
}

export function ProfileFinanceTab({
    student,
    financialSummary,
    currentSemesterFinance,
    financeStatement,
}: Props) {
    const recent = [...(financeStatement?.statement ?? [])].reverse().slice(0, 5);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold">
                        Need invoices, payments or past semesters?
                    </p>
                    <p className="text-xs text-muted-foreground">
                        The Student Finance workspace has this student&apos;s
                        complete record, semester by semester.
                    </p>
                </div>
                <Button asChild size="sm">
                    <Link href={`/admin/finance/students/${student.id}`}>
                        Open full finance
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label="Total invoiced"
                    value={formatMoney(financialSummary.total_invoiced)}
                />
                <StatTile
                    label="Total paid"
                    value={formatMoney(financialSummary.total_paid)}
                    tone="good"
                />
                <StatTile
                    label="Outstanding"
                    value={formatMoney(financialSummary.total_outstanding)}
                    tone={
                        financialSummary.total_outstanding > 0 ? 'bad' : 'good'
                    }
                    hint={
                        financialSummary.overdue_count > 0
                            ? `${financialSummary.overdue_count} overdue`
                            : undefined
                    }
                />
                <div className="rounded-lg border bg-card p-4">
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                        Clearance
                    </p>
                    <div className="mt-2">
                        <StudentFeeBadge
                            status={financialSummary.clearance_status}
                        />
                    </div>
                </div>
            </div>

            <SectionCard
                title={`Current semester · Semester ${student.current_semester}`}
                description={student.academic_year ?? undefined}
            >
                {!currentSemesterFinance ||
                currentSemesterFinance.status === 'none' ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No fees have been issued for this semester yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Charged
                            </p>
                            <p className="font-bold tabular-nums">
                                {formatMoney(currentSemesterFinance.charged)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Paid</p>
                            <p className="font-bold text-emerald-600 tabular-nums">
                                {formatMoney(currentSemesterFinance.paid)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Balance
                            </p>
                            <p
                                className={`font-bold tabular-nums ${currentSemesterFinance.balance > 0 ? 'text-destructive' : ''}`}
                            >
                                {formatMoney(currentSemesterFinance.balance)}
                            </p>
                        </div>
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Recent activity"
                description="The last five ledger entries."
            >
                {recent.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No charges or payments yet.
                    </p>
                ) : (
                    <ul className="divide-y text-sm">
                        {recent.map((entry) => (
                            <li
                                key={`${entry.reference}-${entry.date}`}
                                className="flex items-center gap-3 py-2"
                            >
                                <span className="w-24 text-xs text-muted-foreground">
                                    {entry.date}
                                </span>
                                <span className="flex-1 truncate">
                                    {entry.reason}
                                </span>
                                <span
                                    className={`font-semibold tabular-nums ${entry.paid > 0 ? 'text-emerald-600' : ''}`}
                                >
                                    {entry.paid > 0
                                        ? `+${formatMoney(entry.paid)}`
                                        : `−${formatMoney(entry.charged)}`}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>
        </div>
    );
}
