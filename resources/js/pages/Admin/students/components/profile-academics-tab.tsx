import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Student, StudentGrade } from '@/types/student';
import {
    formatDate,
    ProgressBar,
    SectionCard,
    StatTile,
} from './profile-shared';
import type { AcademicSummary, AttendanceSummary } from './profile-shared';

interface Props {
    student: Student;
    academicSummary: AcademicSummary;
    attendanceSummary: AttendanceSummary;
    onAddGrade: () => void;
    onDeleteGrade: (id: number) => void;
}

const gradeTone: Record<string, string> = {
    passed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
    failed: 'border-destructive/30 bg-destructive/10 text-destructive',
    in_progress: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
};

const attendanceTone: Record<string, string> = {
    present: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
    late: 'border-amber-500/30 bg-amber-500/10 text-amber-600',
    excused: 'border-sky-500/30 bg-sky-500/10 text-sky-600',
    absent: 'border-destructive/30 bg-destructive/10 text-destructive',
};

export function ProfileAcademicsTab({
    student,
    academicSummary,
    attendanceSummary,
    onAddGrade,
    onDeleteGrade,
}: Props) {
    const bySemester = new Map<number, StudentGrade[]>();

    [...(student.grades ?? [])]
        .sort((a, b) => b.semester - a.semester)
        .forEach((grade) => {
            bySemester.set(grade.semester, [
                ...(bySemester.get(grade.semester) ?? []),
                grade,
            ]);
        });

    const rate = attendanceSummary.attendance_rate;
    const recentAttendance = (student.attendances ?? []).slice(0, 8);

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile
                    label="CGPA"
                    value={Number(student.gpa ?? 0).toFixed(2)}
                    hint="out of 4.00"
                />
                <StatTile
                    label="Credits earned"
                    value={academicSummary.completed_credits}
                    hint={`of ${academicSummary.total_credits} attempted`}
                />
                <StatTile
                    label="Passed"
                    value={academicSummary.passed_count}
                    tone="good"
                    hint={`${academicSummary.in_progress_count} in progress`}
                />
                <StatTile
                    label="Failed"
                    value={academicSummary.failed_count}
                    tone={academicSummary.failed_count > 0 ? 'bad' : undefined}
                />
            </div>

            <SectionCard
                title="Results by semester"
                description="Every recorded course, newest semester first."
                action={
                    <Button size="sm" onClick={onAddGrade}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add grade
                    </Button>
                }
            >
                {bySemester.size === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No course results recorded yet.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {[...bySemester.entries()].map(([semester, grades]) => {
                            const credits = grades.reduce(
                                (sum, g) => sum + Number(g.credits),
                                0,
                            );
                            const points = grades.reduce(
                                (sum, g) =>
                                    sum +
                                    Number(g.grade_point || 0) *
                                        Number(g.credits),
                                0,
                            );

                            return (
                                <div key={semester}>
                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                        <span className="font-semibold">
                                            Semester {semester}
                                            {semester ===
                                                student.current_semester && (
                                                <Badge className="ml-2 text-[10px]">
                                                    Current
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {credits} credits · GPA{' '}
                                            {credits > 0
                                                ? (points / credits).toFixed(2)
                                                : '—'}
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto rounded-md border">
                                        <table className="w-full text-xs">
                                            <tbody className="divide-y">
                                                {grades.map((g) => (
                                                    <tr key={g.id}>
                                                        <td className="px-3 py-2 font-mono font-semibold">
                                                            {g.course_code}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {g.course_name}
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">
                                                            {g.credits} cr
                                                        </td>
                                                        <td className="px-3 py-2 font-bold">
                                                            {g.grade || '—'}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={`capitalize ${gradeTone[g.status] ?? ''}`}
                                                            >
                                                                {g.status.replace('_', ' ')}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                aria-label={`Remove ${g.course_code}`}
                                                                onClick={() =>
                                                                    onDeleteGrade(g.id)
                                                                }
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SectionCard>

            <SectionCard
                title="Attendance"
                description="Calculated from every class on record (late counts as half)."
            >
                {rate === null ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No attendance has been recorded for this student yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold tabular-nums">
                                    {rate}%
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {attendanceSummary.present_count} present ·{' '}
                                    {attendanceSummary.late_count} late ·{' '}
                                    {attendanceSummary.absent_count} absent
                                </span>
                            </div>
                            <ProgressBar
                                value={rate}
                                className={rate >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}
                            />
                        </div>
                        <ul className="divide-y rounded-md border text-xs">
                            {recentAttendance.map((a) => (
                                <li
                                    key={a.id}
                                    className="flex items-center gap-3 px-3 py-2"
                                >
                                    <span className="w-24 text-muted-foreground">
                                        {formatDate(a.date)}
                                    </span>
                                    <span className="flex-1 font-medium">
                                        {a.course_name}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={`capitalize ${attendanceTone[a.status] ?? ''}`}
                                    >
                                        {a.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
