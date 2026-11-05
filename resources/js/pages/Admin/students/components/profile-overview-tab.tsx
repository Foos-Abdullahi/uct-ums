import { AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { Student } from '@/types/student';
import {
    FieldRow,
    formatDate,
    formatMoney,
    ProgressBar,
    SectionCard,
    StatTile,
} from './profile-shared';
import type {
    AcademicSummary,
    AttendanceSummary,
    FinancialSummary,
} from './profile-shared';

interface Props {
    student: Student;
    financialSummary: FinancialSummary;
    academicSummary: AcademicSummary;
    attendanceSummary: AttendanceSummary;
    onNavigate: (tab: string) => void;
}

export function ProfileOverviewTab({
    student,
    financialSummary,
    academicSummary,
    attendanceSummary,
    onNavigate,
}: Props) {
    const totalSemesters = student.program?.duration_semesters ?? null;
    const semesterProgress = totalSemesters
        ? (student.current_semester / totalSemesters) * 100
        : 0;
    const rate = attendanceSummary.attendance_rate;

    const attention: { text: string; tab: string }[] = [];

    if (student.enrollment_status === 'suspended') {
        attention.push({
            text: 'This student is suspended and cannot log in.',
            tab: 'account',
        });
    }

    if (financialSummary.overdue_count > 0) {
        attention.push({
            text: `${financialSummary.overdue_count} overdue invoice${financialSummary.overdue_count > 1 ? 's' : ''} — ${formatMoney(financialSummary.total_outstanding)} outstanding.`,
            tab: 'finance',
        });
    } else if (financialSummary.total_outstanding > 0) {
        attention.push({
            text: `${formatMoney(financialSummary.total_outstanding)} fee balance still to be paid.`,
            tab: 'finance',
        });
    }

    if (academicSummary.failed_count > 0) {
        attention.push({
            text: `${academicSummary.failed_count} failed course${academicSummary.failed_count > 1 ? 's' : ''} on record.`,
            tab: 'academics',
        });
    }

    if (rate !== null && rate < 75) {
        attention.push({
            text: `Attendance is low at ${rate}%.`,
            tab: 'academics',
        });
    }

    if ((student.documents?.length ?? 0) === 0) {
        attention.push({
            text: 'No documents have been uploaded yet.',
            tab: 'documents',
        });
    }

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label="Semester"
                    value={`${student.current_semester}${totalSemesters ? ` / ${totalSemesters}` : ''}`}
                    hint={student.academic_year ?? 'Academic year not set'}
                >
                    {totalSemesters ? (
                        <ProgressBar value={semesterProgress} />
                    ) : null}
                </StatTile>
                <StatTile
                    label="CGPA"
                    value={Number(student.gpa ?? 0).toFixed(2)}
                    hint={`${academicSummary.completed_credits} credits earned`}
                />
                <StatTile
                    label="Fee balance"
                    value={formatMoney(financialSummary.total_outstanding)}
                    tone={
                        financialSummary.total_outstanding > 0 ? 'bad' : 'good'
                    }
                    hint={
                        financialSummary.total_outstanding > 0
                            ? 'Outstanding'
                            : 'Fully cleared'
                    }
                />
                <StatTile
                    label="Attendance"
                    value={rate === null ? '—' : `${rate}%`}
                    tone={
                        rate === null ? undefined : rate >= 75 ? 'good' : 'warn'
                    }
                    hint={
                        rate === null
                            ? 'No classes recorded'
                            : `${attendanceSummary.absent_count} absences in ${attendanceSummary.total_classes} classes`
                    }
                />
            </div>

            {/* What needs attention */}
            <section
                className={`rounded-lg border p-4 ${attention.length ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}
            >
                {attention.length === 0 ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Everything looks good — nothing needs attention.
                    </p>
                ) : (
                    <>
                        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                            Needs attention
                        </p>
                        <ul className="space-y-1">
                            {attention.map((item) => (
                                <li key={item.text}>
                                    <button
                                        type="button"
                                        onClick={() => onNavigate(item.tab)}
                                        className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-background/60"
                                    >
                                        {item.text}
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <SectionCard title="Personal details">
                    <div className="divide-y">
                        <FieldRow label="Email">{student.user?.email}</FieldRow>
                        <FieldRow label="Phone">{student.phone || '—'}</FieldRow>
                        <FieldRow label="Gender">
                            <span className="capitalize">
                                {student.gender || '—'}
                            </span>
                        </FieldRow>
                        <FieldRow label="Date of birth">
                            {formatDate(student.date_of_birth)}
                        </FieldRow>
                        <FieldRow label="Mother's name">
                            {student.mother_name || '—'}
                        </FieldRow>
                        <FieldRow label="Address">
                            {student.address || '—'}
                        </FieldRow>
                    </div>
                </SectionCard>

                <SectionCard title="Enrollment">
                    <div className="divide-y">
                        <FieldRow label="Program">
                            {student.program?.name ?? '—'}
                        </FieldRow>
                        <FieldRow label="Level">
                            <span className="capitalize">
                                {student.program?.degree_level ?? '—'}
                            </span>
                        </FieldRow>
                        <FieldRow label="Section">
                            {student.section || '—'}
                        </FieldRow>
                        <FieldRow label="Enrolled on">
                            {formatDate(student.enrollment_date)}
                        </FieldRow>
                        <FieldRow label="Expected graduation">
                            {formatDate(student.graduation_date)}
                        </FieldRow>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}
