import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, Search, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/components/finance/student-statement-sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudentFeeBadge } from '../students/components/student-fee-badge';

interface StudentRow {
    id: number;
    matric_no: string;
    current_semester: number;
    fee_status: string;
    photo_url?: string | null;
    total_billed: number | string | null;
    total_paid: number | string | null;
    user?: { name: string; email: string } | null;
    program?: { name: string } | null;
}

interface Paginated {
    data: StudentRow[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    students: Paginated;
    filters: { search: string; fee_status: string };
}

const FEE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Cleared' },
];

export default function AdminFinanceStudents({ students, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const firstRender = useRef(true);

    const visit = (params: Record<string, string>) => {
        router.get('/admin/finance/students', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timer = setTimeout(() => {
            visit({
                search,
                ...(filters.fee_status !== 'all'
                    ? { fee_status: filters.fee_status }
                    : {}),
            });
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    return (
        <>
            <Head title="Student Finance" />

            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">
                        Student Finance
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Find a student to see their balance, current semester
                        and every past semester&apos;s fees in one place.
                    </p>
                </div>

                <div className="space-y-3 rounded-lg border bg-card p-4">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, matric number, email or phone…"
                            className="h-11 pl-9 text-sm"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {FEE_FILTERS.map((f) => (
                            <Button
                                key={f.value}
                                size="sm"
                                variant={
                                    filters.fee_status === f.value
                                        ? 'default'
                                        : 'outline'
                                }
                                className="h-7 text-xs"
                                onClick={() =>
                                    visit({
                                        search,
                                        ...(f.value !== 'all'
                                            ? { fee_status: f.value }
                                            : {}),
                                    })
                                }
                            >
                                {f.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {students.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
                        <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        No students match your search.
                    </div>
                ) : (
                    <ul className="divide-y rounded-lg border bg-card">
                        {students.data.map((s) => {
                            const name = s.user?.name ?? 'Unknown';
                            const billed = Number(s.total_billed ?? 0);
                            const paid = Number(s.total_paid ?? 0);
                            const balance = Math.max(0, billed - paid);

                            return (
                                <li key={s.id}>
                                    <Link
                                        href={`/admin/finance/students/${s.id}`}
                                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={s.photo_url ?? undefined}
                                                alt={name}
                                            />
                                            <AvatarFallback className="text-xs font-semibold">
                                                {name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                <span className="font-mono">
                                                    {s.matric_no}
                                                </span>{' '}
                                                · {s.program?.name ?? 'No program'}{' '}
                                                · Semester {s.current_semester}
                                            </p>
                                        </div>
                                        <div className="hidden text-right sm:block">
                                            <p
                                                className={`text-sm font-bold tabular-nums ${balance > 0 ? 'text-destructive' : 'text-emerald-600'}`}
                                            >
                                                {formatMoney(balance)}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                of {formatMoney(billed)} billed
                                            </p>
                                        </div>
                                        <StudentFeeBadge status={s.fee_status} />
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {students.last_page > 1 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Page {students.current_page} of {students.last_page}{' '}
                            · {students.total} students
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!students.prev_page_url}
                                onClick={() =>
                                    students.prev_page_url &&
                                    router.get(students.prev_page_url, {}, { preserveScroll: true })
                                }
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={!students.next_page_url}
                                onClick={() =>
                                    students.next_page_url &&
                                    router.get(students.next_page_url, {}, { preserveScroll: true })
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

AdminFinanceStudents.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Finance', href: '/admin/finance' },
        { title: 'Student Finance', href: '/admin/finance/students' },
    ],
};
