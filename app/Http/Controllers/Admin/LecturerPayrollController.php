<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Lecturer;
use App\Models\TeachingSession;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class LecturerPayrollController extends Controller
{
    /**
     * Monthly payroll: hours taught per lecturer and course, at the hourly rate.
     */
    public function index(Request $request): Response
    {
        $month = $this->resolveMonth($request->query('month'));
        $start = $month->startOfMonth();
        $end = $month->endOfMonth();
        $search = trim((string) $request->query('search', ''));

        $sessions = TeachingSession::query()
            ->with(['lecturer.user:id,name', 'course:id,code,name'])
            ->whereBetween('session_date', [$start->toDateString(), $end->toDateString()])
            ->when($search !== '', function ($q) use ($search) {
                $q->whereHas('lecturer.user', fn ($u) => $u->where('name', 'like', "%{$search}%"));
            })
            ->orderBy('session_date')
            ->orderBy('id')
            ->get();

        $rows = $sessions->groupBy('lecturer_id')
            ->map(fn (Collection $items) => $this->lecturerRow($items))
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        return Inertia::render('Admin/lecturer-payroll/index', [
            'month' => $month->format('Y-m'),
            'month_label' => $month->translatedFormat('F Y'),
            'previous_month' => $month->subMonth()->format('Y-m'),
            'next_month' => $month->addMonth()->format('Y-m'),
            'default_rate' => TeachingSession::DEFAULT_HOURLY_RATE,
            'search' => $search,
            'totals' => [
                'lecturers' => $rows->count(),
                'hours' => round($rows->sum('hours'), 2),
                'total' => round($rows->sum('total'), 2),
                'paid' => round($rows->sum('paid'), 2),
                'outstanding' => round($rows->sum('outstanding'), 2),
            ],
            'rows' => $rows,
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
            'courses' => Course::query()
                ->active()
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
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

        return redirect()->route('admin.lecturer-payroll.index', ['month' => $session->session_date->format('Y-m')]);
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

        return $this->backWithToast('success', 'Teaching hours updated.');
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

        $count = TeachingSession::query()
            ->where('lecturer_id', $lecturer->id)
            ->whereNull('paid_at')
            ->whereBetween('session_date', [$month->startOfMonth()->toDateString(), $month->endOfMonth()->toDateString()])
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

        TeachingSession::query()
            ->where('lecturer_id', $lecturer->id)
            ->whereNotNull('paid_at')
            ->whereBetween('session_date', [$month->startOfMonth()->toDateString(), $month->endOfMonth()->toDateString()])
            ->update(['paid_at' => null, 'paid_by' => null]);

        return $this->backWithToast('success', 'Payment reverted.');
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

    /**
     * @param  Collection<int, TeachingSession>  $items
     * @return array<string, mixed>
     */
    private function lecturerRow(Collection $items): array
    {
        $first = $items->first();
        $paidItems = $items->whereNotNull('paid_at');

        $courses = $items->groupBy('course_id')->map(fn (Collection $c) => [
            'course_id' => $c->first()->course_id,
            'code' => $c->first()->course->code ?? '',
            'name' => $c->first()->course->name ?? '',
            'sessions' => $c->count(),
            'hours' => round($c->sum('hours'), 2),
            'total' => round($c->sum(fn ($s) => $s->amount), 2),
        ])->values();

        $total = round($items->sum(fn ($s) => $s->amount), 2);
        $paid = round($paidItems->sum(fn ($s) => $s->amount), 2);

        return [
            'lecturer_id' => $first->lecturer_id,
            'name' => $first->lecturer->user->name ?? 'Unknown',
            'lecturer_no' => $first->lecturer->lecturer_no,
            'sessions' => $items->count(),
            'hours' => round($items->sum('hours'), 2),
            'total' => $total,
            'paid' => $paid,
            'outstanding' => round($total - $paid, 2),
            'status' => $paid <= 0 ? 'unpaid' : ($paid >= $total ? 'paid' : 'partial'),
            'courses' => $courses,
            'entries' => $items->map(fn (TeachingSession $s) => [
                'id' => $s->id,
                'course_id' => $s->course_id,
                'course' => $s->course ? "{$s->course->code} – {$s->course->name}" : '',
                'session_date' => $s->session_date->format('Y-m-d'),
                'hours' => $s->hours,
                'hourly_rate' => $s->hourly_rate,
                'amount' => $s->amount,
                'notes' => $s->notes,
                'paid' => $s->paid_at !== null,
            ])->values(),
        ];
    }
}
