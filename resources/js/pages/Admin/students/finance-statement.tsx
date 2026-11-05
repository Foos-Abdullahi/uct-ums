import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import StudentStatementSheet from '@/components/finance/student-statement-sheet';
import type { StatementEntry, StatementTotals, Student } from '@/types/student';

interface FinanceStatementProps {
    student: Student;
    statement: StatementEntry[];
    totals: StatementTotals;
    generatedAt: string;
    semester?: number | null;
}

export default function FinanceStatement({
    student,
    statement,
    totals,
    generatedAt,
    semester = null,
}: FinanceStatementProps) {
    const studentName = student.user?.name ?? 'Student';

    return (
        <>
            <Head title={`Finance Statement - ${studentName}`} />
            <StudentStatementSheet
                student={student}
                statement={statement}
                totals={totals}
                generatedAt={generatedAt}
                semester={semester}
                isPrintPage={true}
                backUrl={`/admin/finance/students/${student.id}`}
                backLabel="Back to Student Finance"
            />
        </>
    );
}

FinanceStatement.layout = (page: ReactNode) => page;
