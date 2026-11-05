<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lecturer;
use App\Models\TeachingSession;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class LecturerPayrollController extends Controller
{
    /**
     * Monthly payroll roster: one row per lecturer with hours and pay.
     */
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 10;
        }

        $month = $this->resolveMonth($request->input('month'));
        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', '');

        $paidSql = 'SUM(CASE WHEN paid_at IS NOT NULL THEN hours * hourly_rate ELSE 0 END)';

        $query = $this->monthQuery($month)
            ->selectRaw("lecturer_id, COUNT(*) as sessions, SUM(hours) as hours, SUM(hours * hourly_rate) as total, {$paidSql} as paid")
            ->when($search !== '', fn (Builder $q) => $q->whereHas(
                'lecturer',
                fn (Builder $l) => $l->where('lecturer_no', 'like', "%{$search}%")
                    ->orWhereHas('user', fn (Builder $u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")),
            ))
            ->groupBy('lecturer_id')
            ->when($status === 'paid', fn (Builder $q) => $q->havingRaw("{$paidSql} >= SUM(hours * hourly_rate)"))
            ->when($status === 'unpaid', fn (Builder $q) => $q->havingRaw("{$paidSql} <= 0"))
            ->when($status === 'partial', fn (Builder $q) => $q->havingRaw("{$paidSql} > 0 AND {$paidSql} < SUM(hours * hourly_rate)"))
            ->orderByRaw('SUM(hours * hourly_rate) DESC')
            ->orderBy('lecturer_id');

        return Inertia::render('Admin/lecturer-payroll/index', [
            'stats' => Inertia::defer(function () use ($month) {
                $all = $this->monthQuery($month)->get();
                $total = round($all->sum(fn ($s) => $s->amount), 2);
                $paid = round($all->whereNotNull('paid_at')->sum(fn ($s) => $s->amount), 2);

                return [
                    'lecturers' => $all->pluck('lecturer_id')->unique()->count(),
                    'hours' => round($all->sum('hours'), 2),
                    'total' => $total,
                    'paid' => $paid,
                    'outstanding' => round($total - $paid, 2),
                ];
            }),
            'payroll' => Inertia::defer(function () use ($query, $perPage) {
                $page = $query->paginate($perPage)->withQueryString();
                $lecturers = Lecturer::query()
                    ->with('user:id,name,email')
                    ->whereIn('id', $page->pluck('lecturer_id'))
                    ->get()
                    ->keyBy('id');

                return $page->through(function ($row) use ($lecturers) {
                    $lecturer = $lecturers->get($row->lecturer_id);
                    $total = round((float) $row->total, 2);
                    $paid = round((float) $row->paid, 2);

                    return [
                        'lecturer_id' => $row->lecturer_id,
                        'name' => $lecturer?->user?->name ?? 'Unknown',
                        'email' => $lecturer?->user?->email,
                        'lecturer_no' => $lecturer?->lecturer_no,
                        'department' => $lecturer?->department,
                        'sessions' => (int) $row->sessions,
                        'hours' => round((float) $row->hours, 2),
                        'total' => $total,
                        'paid' => $paid,
                        'outstanding' => round($total - $paid, 2),
                        'status' => $this->paymentStatus($total, $paid),
                    ];
                });
            }),
            'months' => $this->monthOptions($month),
            'default_rate' => TeachingSession::DEFAULT_HOURLY_RATE,
            'filters' => [
                'search' => $search,
                'month' => $month->format('Y-m'),
                'status' => $status !== '' ? $status : 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show the form to record teaching hours.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Admin/lecturer-payroll/create', [
            ...$this->formOptions(),
            'lecturer_id' => $request->integer('lecturer_id') ?: null,
        ]);
    }

    /**
     * Record hours taught for a lecturer on a course.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateSession($request);

        $session = TeachingSession::create([
            ...$validated,
            'hourly_rate' => $validated['hourly_rate'] ?? TeachingSession::DEFAULT_HOURLY_RATE,
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Teaching hours recorded.']);

        return redirect()->route('admin.lecturer-payroll.show', [
            'lecturer' => $session->lecturer_id,
            'month' => $session->session_date->format('Y-m'),
        ]);
    }

    /**
     * Show one lecturer's hours, courses and entries for a month.
     */
    public function show(Request $request, Lecturer $lecturer): Response
    {
        $month = $this->resolveMonth($request->input('month'));
        $lecturer->load('user:id,name,email');

        $entries = $this->monthQuery($month)
            ->where('lecturer_id', $lecturer->id)
            ->with('course:id,code,name')
            ->orderBy('session_date')
            ->orderBy('id')
            ->get();

        $total = round($entries->sum(fn ($s) => $s->amount), 2);
        $paid = round($entries->whereNotNull('paid_at')->sum(fn ($s) => $s->amount), 2);

        return Inertia::render('Admin/lecturer-payroll/show', [
            'lecturer' => [
                'id' => $lecturer->id,
                'name' => $lecturer->user->name ?? 'Unknown',
                'email' => $lecturer->user->email ?? null,
                'lecturer_no' => $lecturer->lecturer_no,
                'department' => $lecturer->department,
                'designation' => $lecturer->designation,
                'employment_status' => $lecturer->employment_status,
            ],
            'month' => $month->format('Y-m'),
            'month_label' => $month->format('F Y'),
            'previous_month' => $month->subMonth()->format('Y-m'),
            'next_month' => $month->addMonth()->format('Y-m'),
            'summary' => [
                'sessions' => $entries->count(),
                'hours' => round($entries->sum('hours'), 2),
                'total' => $total,
                'paid' => $paid,
                'outstanding' => round($total - $paid, 2),
                'status' => $this->paymentStatus($total, $paid),
            ],
            'courses' => $entries->groupBy('course_id')->map(fn (Collection $c) => [
                'course_id' => $c->first()->course_id,
                'code' => $c->first()->course->code ?? '',
                'name' => $c->first()->course->name ?? '',
                'sessions' => $c->count(),
                'hours' => round($c->sum('hours'), 2),
                'total' => round($c->sum(fn ($s) => $s->amount), 2),
            ])->values(),
            'entries' => $entries->map(fn (TeachingSession $s) => [
                'id' => $s->id,
                'course' => $s->course ? "{$s->course->code} – {$s->course->name}" : '',
                'session_date' => $s->session_date->format('Y-m-d'),
                'hours' => $s->hours,
                'hourly_rate' => $s->hourly_rate,
                'amount' => $s->amount,
                'notes' => $s->notes,
                'paid' => $s->paid_at !== null,
            ])->values(),
        ]);
    }

    /**
     * Show the form to correct a recorded entry.
     */
    public function edit(TeachingSession $session): Response|RedirectResponse
    {
        if ($session->paid_at) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'This entry is already paid and cannot be changed.']);

            return redirect()->route('admin.lecturer-payroll.show', [
                'lecturer' => $session->lecturer_id,
                'month' => $session->session_date->format('Y-m'),
            ]);
        }

        $session->load('lecturer.user:id,name');

        return Inertia::render('Admin/lecturer-payroll/edit', [
            ...$this->formOptions(),
            'entry' => [
                'id' => $session->id,
                'lecturer_id' => $session->lecturer_id,
                'lecturer_name' => $session->lecturer->user->name ?? 'Unknown',
                'course_id' => $session->course_id,
                'session_date' => $session->session_date->format('Y-m-d'),
                'hours' => $session->hours,
                'hourly_rate' => $session->hourly_rate,
                'notes' => $session->notes,
            ],
        ]);
    }

    /**
     * Correct a recorded entry (only while it is unpaid).
     */
    public function update(Request $request, TeachingSession $session): RedirectResponse
    {
        if ($session->paid_at) {
            return $this->backWithToast('error', 'This entry is already paid and cannot be changed.');
        }

        $validated = $this->validateSession($request);

        $session->update([
            ...$validated,
            'hourly_rate' => $validated['hourly_rate'] ?? $session->hourly_rate,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Teaching hours updated.']);

        return redirect()->route('admin.lecturer-payroll.show', [
            'lecturer' => $session->lecturer_id,
            'month' => $session->session_date->format('Y-m'),
        ]);
    }

    public function destroy(TeachingSession $session): RedirectResponse
    {
        if ($session->paid_at) {
            return $this->backWithToast('error', 'This entry is already paid and cannot be deleted.');
        }

        $session->delete();

        return $this->backWithToast('success', 'Entry deleted.');
    }

    /**
     * Mark every unpaid entry of a lecturer in the given month as paid.
     */
    public function markPaid(Request $request, Lecturer $lecturer): RedirectResponse
    {
        $month = $this->resolveMonth($request->input('month'));

        $count = $this->monthQuery($month)
            ->where('lecturer_id', $lecturer->id)
            ->whereNull('paid_at')
            ->update(['paid_at' => now(), 'paid_by' => $request->user()->id]);

        return $count > 0
            ? $this->backWithToast('success', "Marked {$count} entries as paid.")
            : $this->backWithToast('error', 'Nothing to pay for this month.');
    }

    /**
     * Undo a payment for a lecturer for the given month (e.g. marked by mistake).
     */
    public function markUnpaid(Request $request, Lecturer $lecturer): RedirectResponse
    {
        $month = $this->resolveMonth($request->input('month'));

        $this->monthQuery($month)
            ->where('lecturer_id', $lecturer->id)
            ->whereNotNull('paid_at')
            ->update(['paid_at' => null, 'paid_by' => null]);

        return $this->backWithToast('success', 'Payment reverted.');
    }

    /**
     * @return Builder<TeachingSession>
     */
    private function monthQuery(CarbonImmutable $month): Builder
    {
        return TeachingSession::query()->whereBetween('session_date', [
            $month->startOfMonth()->toDateString(),
            $month->endOfMonth()->toDateString(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'default_rate' => TeachingSession::DEFAULT_HOURLY_RATE,
            'lecturers' => Lecturer::query()
                ->with('user:id,name')
                ->where('employment_status', 'active')
                ->get()
                ->map(fn (Lecturer $l) => [
                    'id' => $l->id,
                    'name' => $l->user->name ?? 'Unknown',
                    'lecturer_no' => $l->lecturer_no,
                ])
                ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                ->values(),
            'courses' => Course::query()->active()->orderBy('code')->get(['id', 'code', 'name']),
        ];
    }

    /**
     * Last 12 months (plus the selected one) for the month filter.
     *
     * @return list<array{label: string, value: string}>
     */
    private function monthOptions(CarbonImmutable $selected): array
    {
        $current = CarbonImmutable::now()->startOfMonth();
        $months = collect(range(0, 11))->map(fn ($i) => $current->subMonths($i));

        if (! $months->contains(fn ($m) => $m->format('Y-m') === $selected->format('Y-m'))) {
            $months->push($selected);
        }

        return $months->map(fn ($m) => ['label' => $m->format('F Y'), 'value' => $m->format('Y-m')])->values()->all();
    }

    private function paymentStatus(float $total, float $paid): string
    {
        return $paid <= 0 ? 'unpaid' : ($paid >= $total ? 'paid' : 'partial');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateSession(Request $request): array
    {
        return $request->validate([
            'lecturer_id' => ['required', 'integer', 'exists:lecturers,id'],
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'session_date' => ['required', 'date', 'before_or_equal:today'],
            'hours' => ['required', 'numeric', 'min:0.25', 'max:24'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
    }

    private function backWithToast(string $type, string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => $type, 'message' => $message]);

        return back();
    }

    private function resolveMonth(mixed $value): CarbonImmutable
    {
        if (is_string($value) && preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $value)) {
            return CarbonImmutable::createFromFormat('!Y-m', $value);
        }

        return CarbonImmutable::now()->startOfMonth();
    }
}
