import { Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { StatementEntry, StatementTotals, Student } from '@/types/student';

interface StudentStatementSheetProps {
    student: Student;
    statement: StatementEntry[];
    totals: StatementTotals;
    generatedAt?: string;
    isPrintPage?: boolean;
    backUrl?: string;
    backLabel?: string;
    printUrl?: string;
}

export const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export default function StudentStatementSheet({
    student,
    statement,
    totals,
    generatedAt = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }),
    isPrintPage = false,
    backUrl,
    backLabel = 'Back',
    printUrl,
}: StudentStatementSheetProps) {
    const studentName = student.user?.name ?? 'Student';
    const initials = studentName
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    return (
        <div className={isPrintPage ? 'min-h-screen bg-slate-100 p-4 sm:p-8 print:bg-white print:p-0' : 'space-y-4'}>
            {isPrintPage && (
                <style>{`
                    @media print {
                        @page { size: A4 landscape; margin: 10mm; }
                        body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none !important; }
                        .statement-sheet { box-shadow: none !important; border: 1px solid #cbd5e1 !important; margin: 0 !important; max-width: 100% !important; }
                    }
                `}</style>
            )}

            {/* Actions Bar */}
            <div className="no-print flex items-center justify-between gap-2">
                <div>
                    {backUrl ? (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={backUrl}>
                                <ArrowLeft className="mr-2 size-4" />
                                {backLabel}
                            </Link>
                        </Button>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    {printUrl ? (
                        <Button variant="outline" size="sm" asChild>
                            <Link href={printUrl}>
                                <Printer className="mr-2 size-4" />
                                Printable Statement
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="mr-2 size-4" />
                            Print Statement
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Statement Sheet */}
            <section className="statement-sheet mx-auto overflow-hidden rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm print:shadow-none">
                {/* Header Information */}
                <header className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-20 rounded-md border-2 border-slate-200">
                            <AvatarImage
                                src={student.photo_url ?? undefined}
                                alt={studentName}
                                className="object-cover"
                            />
                            <AvatarFallback className="rounded-md bg-slate-100 text-xl font-bold text-slate-700">
                                {initials || 'ST'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                Student Finance Statement
                            </p>
                            <h1 className="mt-0.5 text-2xl font-bold text-slate-950">
                                {studentName}
                            </h1>
                            <p className="mt-0.5 text-sm text-slate-600">
                                <span className="font-semibold text-slate-800">ID:</span> {student.matric_no}
                                {' · '}
                                <span className="font-semibold text-slate-800">Program:</span> {student.program?.name ?? 'No program assigned'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-600 sm:text-right">
                        <div>
                            <span className="font-medium text-slate-500">Academic Year:</span>
                        </div>
                        <div className="font-semibold text-slate-900">
                            {student.academic_year || '—'}
                        </div>

                        <div>
                            <span className="font-medium text-slate-500">Semester:</span>
                        </div>
                        <div className="font-semibold text-slate-900">
                            {student.current_semester}
                            {student.section ? ` (Sec ${student.section})` : ''}
                        </div>

                        <div>
                            <span className="font-medium text-slate-500">Generated:</span>
                        </div>
                        <div className="text-slate-800">
                            {generatedAt}
                        </div>
                    </div>
                </header>

                {/* Ledger Table */}
                <div className="overflow-x-auto p-4 sm:p-6">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-sky-600 text-white">
                                <th className="px-3 py-2 text-left font-semibold">Ref</th>
                                <th className="px-3 py-2 text-left font-semibold">Date</th>
                                <th className="px-3 py-2 text-right font-semibold">Paid</th>
                                <th className="px-3 py-2 text-right font-semibold">Charged</th>
                                <th className="px-3 py-2 text-left font-semibold">Reason</th>
                                <th className="px-3 py-2 text-right font-semibold">Running balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {statement.length > 0 ? (
                                statement.map((entry, index) => {
                                    const isNegative = entry.balance < 0;
                                    const isPositive = entry.balance > 0;

                                    return (
                                        <tr
                                            key={`${entry.reference}-${index}`}
                                            className="even:bg-slate-50/70 hover:bg-slate-100/60"
                                        >
                                            <td className="px-3 py-2 font-mono text-xs font-medium text-slate-700">
                                                {entry.reference}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                                                {entry.date}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-medium text-emerald-700">
                                                {entry.paid > 0 ? formatMoney(entry.paid) : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-medium text-slate-900">
                                                {entry.charged > 0 ? formatMoney(entry.charged) : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                                {entry.reason}
                                            </td>
                                            <td className={`px-3 py-2 text-right font-semibold tabular-nums ${
                                                isNegative ? 'text-red-600' : isPositive ? 'text-emerald-600' : 'text-slate-700'
                                            }`}>
                                                {formatMoney(entry.balance)}
                                            </td>
                                        </tr>
                                    );
                                })
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
                                <td colSpan={2} className="px-3 py-2 text-left">
                                    Total
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                    {formatMoney(totals.paid)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                    {formatMoney(totals.charged)}
                                </td>
                                <td />
                                <td className="px-3 py-2 text-right tabular-nums">
                                    {formatMoney(totals.balance)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
                        <p>
                            * Running balance = Paid − Charged. A negative balance indicates an outstanding amount owed; positive indicates credit.
                        </p>
                        <p className="font-medium text-slate-700">
                            Current Balance:{' '}
                            <span className={totals.balance < 0 ? 'text-red-600 font-bold' : totals.balance > 0 ? 'text-emerald-600 font-bold' : 'text-slate-900 font-bold'}>
                                {formatMoney(totals.balance)}
                            </span>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
