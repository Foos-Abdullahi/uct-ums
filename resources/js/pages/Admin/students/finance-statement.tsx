import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Student } from '@/types/student';

interface StatementEntry {
    reference: string;
    date: string;
    paid: number;
    charged: number;
    reason: string;
    balance: number;
}

interface FinanceStatementProps {
    student: Student;
    statement: StatementEntry[];
    totals: {
        paid: number;
        charged: number;
        balance: number;
    };
    generatedAt: string;
}

const money = (amount: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);

export default function FinanceStatement({
    student,
    statement,
    totals,
    generatedAt,
}: FinanceStatementProps) {
    const studentName = student.user?.name ?? 'Student';
    const initials = studentName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            <Head title={`Finance Statement - ${studentName}`} />
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 12mm; }
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    .statement-sheet { box-shadow: none !important; border: 0 !important; }
                }
            `}</style>

            <main className="min-h-screen bg-slate-100 p-4 sm:p-8 print:bg-white print:p-0">
                <div className="no-print mx-auto mb-4 flex max-w-6xl items-center justify-between">
                    <Button variant="outline" asChild>
                        <Link
                            href={`/admin/students/${student.id}?tab=finance`}
                        >
                            <ArrowLeft className="mr-2 size-4" />
                            Back to Student
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 size-4" />
                        Print Statement
                    </Button>
                </div>

                <section className="statement-sheet mx-auto max-w-6xl overflow-hidden rounded-md border bg-white shadow-sm">
                    <header className="flex flex-col gap-5 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="size-20 border-2 border-slate-200">
                                <AvatarImage
                                    src={student.photo_url ?? undefined}
                                    alt={studentName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-slate-100 text-xl font-bold text-slate-700">
                                    {initials || 'ST'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
                                    Student Finance Statement
                                </p>
                                <h1 className="mt-1 text-2xl font-bold text-slate-950">
                                    {studentName}
                                </h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    {student.matric_no} ·{' '}
                                    {student.program?.name ??
                                        'No program assigned'}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-600 sm:text-right">
                            <p>Generated: {generatedAt}</p>
                            <p>Semester: {student.current_semester}</p>
                        </div>
                    </header>

                    <div className="overflow-x-auto p-6">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-sky-600 text-white">
                                    <th className="px-3 py-2 text-left font-semibold">
                                        Ref
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        Date
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold">
                                        Paid
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold">
                                        Charged
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold">
                                        Reason
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold">
                                        Balance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {statement.length > 0 ? (
                                    statement.map((entry, index) => (
                                        <tr
                                            key={`${entry.reference}-${index}`}
                                            className="even:bg-slate-50"
                                        >
                                            <td className="px-3 py-2 font-mono text-xs text-slate-700">
                                                {entry.reference}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                                {entry.date}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {entry.paid > 0
                                                    ? money(entry.paid)
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {entry.charged > 0
                                                    ? money(entry.charged)
                                                    : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                                {entry.reason}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium tabular-nums">
                                                {money(entry.balance)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-3 py-10 text-center text-slate-500"
                                        >
                                            No finance transactions recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-red-600 font-bold text-white">
                                    <td colSpan={2} className="px-3 py-2">
                                        Total
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {money(totals.paid)}
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {money(totals.charged)}
                                    </td>
                                    <td />
                                    <td className="px-3 py-2 text-right tabular-nums">
                                        {money(totals.balance)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>
            </main>
        </>
    );
}

FinanceStatement.layout = (page: ReactNode) => page;
