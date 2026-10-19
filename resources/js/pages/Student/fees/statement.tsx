import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import StudentStatementSheet from '@/components/finance/student-statement-sheet';
import type { StatementEntry, StatementTotals, Student } from '@/types/student';

interface StatementProps {
    student: Student;
    statement: StatementEntry[];
    totals: StatementTotals;
    generatedAt: string;
}

export default function StudentFeesStatement({
    student,
    statement,
    totals,
    generatedAt,
}: StatementProps) {
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
                backUrl="/student/fees"
                backLabel="Back to Fees"
            />
        </>
    );
}

StudentFeesStatement.layout = (page: ReactNode) => page;
