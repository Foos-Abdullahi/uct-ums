import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import StudentStatementSheet from '@/components/finance/student-statement-sheet';
import type { StatementEntry, StatementTotals, Student } from '@/types/student';

interface FinanceStatementProps {
    student: Student;
    statement: StatementEntry[];
    totals: StatementTotals;
    generatedAt: string;
}

export default function FinanceStatement({
    student,
    statement,
    totals,
    generatedAt,
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
                isPrintPage={true}
                backUrl={`/admin/students/${student.id}?tab=finance`}
                backLabel="Back to Student"
            />
        </>
    );
}

FinanceStatement.layout = (page: ReactNode) => page;
