<?php

namespace App\Http\Controllers\Admin;

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdmissionController extends Controller
{
    /**
     * Display a listing of admissions applications.
     */
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 10;
        }

        $search = $request->input('search');
        $status = $request->input('status');
        $programId = $request->input('program_id');

        $query = Admission::query()
            ->with(['program', 'student.user'])
            ->search($search)
            ->filterStatus($status)
            ->filterProgram($programId)
            ->latest('id');

        return Inertia::render('Admin/admissions/index', [
            'stats' => Inertia::defer(fn () => [
                'total_applications' => Admission::count(),
                'pending' => Admission::where('status', 'pending')->count(),
                'under_review' => Admission::where('status', 'under_review')->count(),
                'approved' => Admission::where('status', 'approved')->count(),
                'rejected' => Admission::where('status', 'rejected')->count(),
                'enrolled' => Admission::where('status', 'enrolled')->count(),
            ]),
            'admissions' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'programs' => Program::select('id', 'name', 'degree_level')->get(),
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? 'all',
                'program_id' => $programId ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create an admission application.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/admissions/create', [
            'programs' => Program::select('id', 'name', 'degree_level', 'duration_semesters')->get(),
        ]);
    }

    /**
     * Store a new admission application.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'in:Male,Female,Other'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'program_id' => ['required', 'exists:programs,id'],
            'entry_semester' => ['nullable', 'string', 'max:50'],
            'previous_qualification' => ['nullable', 'string', 'max:255'],
            'previous_gpa' => ['nullable', 'numeric', 'min:0', 'max:4.00'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $nextId = (Admission::max('id') ?? 0) + 1;
        $applicationNo = 'ADM-'.date('Y').'-'.str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);

        $admission = Admission::create([
            ...$validated,
            'application_no' => $applicationNo,
            'application_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        return redirect()->route('admin.admissions.show', $admission->id)
            ->with('success', "Application {$admission->application_no} submitted successfully.");
    }

    /**
     * Display the admission application details.
     */
    public function show(int $id): Response
    {
        $admission = Admission::with(['program', 'student.user'])->findOrFail($id);

        return Inertia::render('Admin/admissions/show', [
            'admission' => $admission,
            'programs' => Program::select('id', 'name', 'degree_level', 'duration_semesters')->get(),
        ]);
    }

    /**
     * Update application review status.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $admission = Admission::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,under_review,approved,rejected'],
            'review_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $admission->update([
            'status' => $validated['status'],
            'review_notes' => $validated['review_notes'] ?? $admission->review_notes,
        ]);

        return back()->with('success', "Application status updated to {$validated['status']}.");
    }

    /**
     * Convert an approved admission into an enrolled student account.
     */
    public function convertToStudent(Request $request, int $id): RedirectResponse
    {
        $admission = Admission::with('program')->findOrFail($id);

        if ($admission->student_id) {
            return redirect()->route('admin.students.show', $admission->student_id)
                ->with('info', 'This applicant has already been converted to a student.');
        }

        $validated = $request->validate([
            'matric_no' => ['nullable', 'string', 'max:50', 'unique:students,matric_no'],
            'initial_fee_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $matricNo = $validated['matric_no'] ?? null;
        if (! $matricNo) {
            $nextId = (Student::max('id') ?? 0) + 1;
            $matricNo = 'UCT-'.date('Y').'-'.str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);
        }

        $student = DB::transaction(function () use ($admission, $matricNo, $validated) {
            // Check if user exists or create
            $user = User::where('email', $admission->email)->first();
            if (! $user) {
                $user = User::create([
                    'name' => $admission->full_name,
                    'email' => $admission->email,
                    'password' => Hash::make('password123'),
                    'role' => UserRole::Student,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]);
            }

            $student = Student::create([
                'user_id' => $user->id,
                'matric_no' => $matricNo,
                'program_id' => $admission->program_id,
                'current_semester' => 1,
                'phone' => $admission->phone,
                'gender' => $admission->gender,
                'date_of_birth' => $admission->date_of_birth,
                'address' => $admission->address,
                'fee_status' => FeeStatus::Unpaid->value,
                'enrollment_status' => 'enrolled',
                'enrollment_date' => now()->toDateString(),
            ]);

            $admission->update([
                'status' => 'enrolled',
                'student_id' => $student->id,
            ]);

            $feeAmount = ! empty($validated['initial_fee_amount']) ? (float) $validated['initial_fee_amount'] : 1200.00;
            StudentInvoice::create([
                'student_id' => $student->id,
                'invoice_no' => 'INV-'.date('Y').'-'.str_pad((string) $student->id, 4, '0', STR_PAD_LEFT),
                'title' => 'Semester 1 Registration & Tuition Fee',
                'type' => 'tuition',
                'amount' => $feeAmount,
                'paid_amount' => 0.00,
                'due_date' => now()->addMonth()->toDateString(),
                'status' => 'unpaid',
            ]);

            return $student;
        });

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', "Applicant converted to Student {$student->matric_no} successfully.");
    }

    /**
     * Soft delete an admission application.
     */
    public function destroy(int $id): RedirectResponse
    {
        $admission = Admission::findOrFail($id);
        $admission->delete();

        return redirect()->route('admin.admissions.index')
            ->with('success', 'Application deleted successfully.');
    }
}
