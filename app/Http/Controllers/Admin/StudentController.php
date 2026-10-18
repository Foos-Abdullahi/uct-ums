<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Finance\ManageStudentPayment;
use App\Enums\FeeStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Imports\StudentImport;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentCertificate;
use App\Models\StudentDocument;
use App\Models\StudentGrade;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel as ExcelFacade;
use Throwable;

class StudentController extends Controller
{
    /**
     * Display a listing of students with deferred stats and pagination.
     */
    public function index(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 10;
        }

        $search = $request->input('search');
        $enrollmentStatus = $request->input('enrollment_status');
        $feeStatus = $request->input('fee_status');
        $programId = $request->input('program_id');
        $semester = $request->input('semester');
        $gender = $request->input('gender');

        $query = Student::query()
            ->with(['user', 'program'])
            ->search($search)
            ->filterEnrollmentStatus($enrollmentStatus)
            ->filterFeeStatus($feeStatus)
            ->filterProgram($programId)
            ->filterSemester($semester)
            ->filterGender($gender)
            ->latest('id');

        return Inertia::render('Admin/students/index', [
            'stats' => Inertia::defer(fn () => [
                'total_students' => Student::count(),
                'active_students' => Student::where('enrollment_status', 'enrolled')->count(),
                'pending_students' => Student::where('enrollment_status', 'pending')->count(),
                'suspended_students' => Student::where('enrollment_status', 'suspended')->count(),
                'graduated_students' => Student::where('enrollment_status', 'graduated')->count(),
            ]),
            'students' => Inertia::defer(fn () => $query->paginate($perPage)->withQueryString()),
            'programs' => Program::select('id', 'name', 'degree_level')->get(),
            'filters' => [
                'search' => $search ?? '',
                'enrollment_status' => $enrollmentStatus ?? 'all',
                'fee_status' => $feeStatus ?? 'all',
                'program_id' => $programId ?? 'all',
                'semester' => $semester ?? 'all',
                'gender' => $gender ?? 'all',
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show form to create a student.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/students/create', [
            'programs' => Program::select('id', 'name', 'degree_level', 'duration_semesters')->get(),
        ]);
    }

    /**
     * Store a new student and user account.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'matric_no' => ['nullable', 'string', 'max:50', 'unique:students,matric_no'],
            'program_id' => ['required', 'exists:programs,id'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'current_semester' => ['nullable', 'integer', 'min:1', 'max:'.config('academic.total_semesters')],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'in:Male,Female,Other'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'fee_status' => ['nullable', 'string', 'in:paid,unpaid,partial'],
            'enrollment_status' => ['nullable', 'string', 'in:enrolled,pending,suspended,graduated,withdrawn'],
            'enrollment_date' => ['nullable', 'date'],
            'initial_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'photo' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max('2mb')],
        ]);

        $photoPath = $request->file('photo')?->store('student-photos', 'public');

        $matricNo = $validated['matric_no'] ?? null;
        if (! $matricNo) {
            $nextId = (Student::max('id') ?? 0) + 1;
            $matricNo = 'UCT-'.date('Y').'-'.str_pad((string) $nextId, 5, '0', STR_PAD_LEFT);
        }

        $password = $validated['password'] ?? 'password123';
        $enrollmentStatus = $validated['enrollment_status'] ?? 'enrolled';

        try {
            $student = DB::transaction(function () use ($validated, $matricNo, $password, $enrollmentStatus, $photoPath) {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'password' => Hash::make($password),
                    'role' => UserRole::Student,
                    'is_active' => $enrollmentStatus !== 'suspended',
                    'email_verified_at' => now(),
                ]);

                $student = Student::create([
                    'user_id' => $user->id,
                    'matric_no' => $matricNo,
                    'program_id' => $validated['program_id'],
                    'academic_year' => $validated['academic_year'] ?? null,
                    'current_semester' => $validated['current_semester'] ?? 1,
                    'phone' => $validated['phone'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'date_of_birth' => $validated['date_of_birth'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'photo_path' => $photoPath,
                    'fee_status' => $validated['fee_status'] ?? FeeStatus::Unpaid->value,
                    'enrollment_status' => $enrollmentStatus,
                    'enrollment_date' => $validated['enrollment_date'] ?? now()->toDateString(),
                ]);

                if (! empty($validated['initial_fee_amount']) && (float) $validated['initial_fee_amount'] > 0) {
                    StudentInvoice::create([
                        'student_id' => $student->id,
                        'invoice_no' => 'INV-'.date('Y').'-'.str_pad((string) $student->id, 4, '0', STR_PAD_LEFT),
                        'title' => 'Semester 1 Registration & Tuition Fee',
                        'type' => 'tuition',
                        'amount' => (float) $validated['initial_fee_amount'],
                        'paid_amount' => 0.00,
                        'due_date' => now()->addMonth()->toDateString(),
                        'status' => 'unpaid',
                    ]);
                    $student->recalculateFinancials();
                }

                return $student;
            });
        } catch (Throwable $exception) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            throw $exception;
        }

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', "Student {$student->matric_no} created successfully.");
    }

    /**
     * Import students from an Excel (.xlsx) spreadsheet.
     */
    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx', 'max:5120'],
            'program' => ['nullable', 'string', 'max:255'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'enrollment_status' => ['nullable', 'string', 'in:enrolled,pending,suspended,graduated,withdrawn'],
        ]);

        $academicYear = $validated['academic_year'] ?? null;

        if ($academicYear === null || $academicYear === '') {
            $fileName = $validated['file']->getClientOriginalName();

            if (preg_match('/(?<!\d)(19|20)\d{2}(?!\d)/', $fileName, $match)) {
                $academicYear = $match[0];
            }
        }

        try {
            $sheets = ExcelFacade::toArray(new StudentImport, $validated['file']);
            $rows = reset($sheets) ?: [];
            $result = (new StudentImport)->processRows(
                $rows,
                $validated['program'] ?? null,
                $academicYear,
                $validated['enrollment_status'] ?? null,
            );
        } catch (Throwable $e) {
            return response()->json([
                'imported' => 0,
                'failed' => 0,
                'errors' => ['Could not read the file: '.$e->getMessage()],
            ], 422);
        }

        return response()->json($result);
    }

    /**
     * Display full student profile.
     */
    public function show(Student $student): Response
    {
        $student->load([
            'user',
            'program',
            'admission',
            'documents' => fn ($q) => $q->latest(),
            'invoices' => fn ($q) => $q->withCount('items')->latest(),
            'payments' => fn ($q) => $q->latest(),
            'grades' => fn ($q) => $q->orderBy('semester')->orderBy('course_code'),
            'certificates' => fn ($q) => $q->latest(),
            'attendances' => fn ($q) => $q->latest('date')->take(50),
        ]);

        $totalInvoiced = (float) $student->invoices->sum('amount');
        $totalPaid = (float) $student->invoices->sum('paid_amount');
        $totalOutstanding = max(0, $totalInvoiced - $totalPaid);
        $overdueCount = $student->invoices
            ->filter(fn ($invoice) => $invoice->status !== 'paid'
                && $invoice->due_date
                && $invoice->due_date->lt(now()))
            ->count();

        $grades = $student->grades;
        $totalCredits = (int) $grades->sum('credits');
        $completedGrades = $grades->where('status', 'passed');
        $completedCredits = (int) $completedGrades->sum('credits');
        $passedCount = $completedGrades->count();
        $failedCount = $grades->where('status', 'failed')->count();
        $inProgressCount = $grades->where('status', 'in_progress')->count();

        $attendances = $student->attendances;
        $totalClasses = $attendances->count();
        $presentCount = $attendances->where('status', 'present')->count();
        $lateCount = $attendances->where('status', 'late')->count();
        $absentCount = $attendances->where('status', 'absent')->count();
        $attendanceRate = $totalClasses > 0 ? round((($presentCount + ($lateCount * 0.5)) / $totalClasses) * 100, 1) : 100.0;

        return Inertia::render('Admin/students/show', [
            'student' => $student,
            'programs' => Program::select('id', 'name', 'degree_level', 'duration_semesters')->get(),
            'financialSummary' => [
                'total_invoiced' => $totalInvoiced,
                'total_paid' => $totalPaid,
                'total_outstanding' => $totalOutstanding,
                'overdue_count' => $overdueCount,
            ],
            'academicSummary' => [
                'total_credits' => $totalCredits,
                'completed_credits' => $completedCredits,
                'passed_count' => $passedCount,
                'failed_count' => $failedCount,
                'in_progress_count' => $inProgressCount,
                'gpa' => $student->gpa ?? 0.00,
            ],
            'attendanceSummary' => [
                'total_classes' => $totalClasses,
                'present_count' => $presentCount,
                'late_count' => $lateCount,
                'absent_count' => $absentCount,
                'attendance_rate' => $attendanceRate,
            ],
        ]);
    }

    /**
     * Show form to edit a student.
     */
    public function edit(Student $student): Response
    {
        $student->load(['user', 'program']);

        return Inertia::render('Admin/students/edit', [
            'student' => $student,
            'programs' => Program::select('id', 'name', 'degree_level', 'duration_semesters')->get(),
        ]);
    }

    /**
     * Display a printable student finance statement.
     */
    public function financeStatement(Student $student): Response
    {
        $student->load(['user', 'program', 'invoices', 'payments.invoice']);

        $entries = $student->invoices
            ->map(fn (StudentInvoice $invoice) => [
                'reference' => $invoice->invoice_no,
                'date' => $invoice->issue_date?->format('Y-m-d') ?? $invoice->created_at->format('Y-m-d'),
                'paid' => 0.0,
                'charged' => (float) $invoice->amount,
                'reason' => $invoice->title,
                'sort_order' => 0,
            ])
            ->concat($student->payments
                ->where('status', PaymentStatus::Paid->value)
                ->map(fn (StudentPayment $payment) => [
                    'reference' => $payment->transaction_no,
                    'date' => $payment->payment_date?->format('Y-m-d') ?? $payment->created_at->format('Y-m-d'),
                    'paid' => (float) $payment->amount,
                    'charged' => 0.0,
                    'reason' => $payment->invoice?->title ?? 'Student payment',
                    'sort_order' => 1,
                ]))
            ->sortBy([['date', 'asc'], ['sort_order', 'asc']]);

        $balance = 0.0;
        $statement = $entries->map(function (array $entry) use (&$balance): array {
            $balance += $entry['paid'] - $entry['charged'];

            return [...$entry, 'balance' => $balance];
        })->values();

        return Inertia::render('Admin/students/finance-statement', [
            'student' => $student,
            'statement' => $statement,
            'totals' => [
                'charged' => (float) $student->invoices->sum('amount'),
                'paid' => (float) $student->payments
                    ->where('status', PaymentStatus::Paid->value)
                    ->sum('amount'),
                'balance' => $balance,
            ],
            'generatedAt' => now()->format('d M Y'),
        ]);
    }

    /**
     * Update student details.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $student = Student::with('user')->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$student->user_id],
            'matric_no' => ['required', 'string', 'max:50', 'unique:students,matric_no,'.$student->id],
            'program_id' => ['required', 'exists:programs,id'],
            'academic_year' => ['nullable', 'string', 'max:20'],
            'current_semester' => ['required', 'integer', 'min:1', 'max:'.config('academic.total_semesters')],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'string', 'in:Male,Female,Other'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'fee_status' => ['required', 'string', 'in:paid,unpaid,partial'],
            'enrollment_status' => ['required', 'string', 'in:enrolled,pending,suspended,graduated,withdrawn'],
            'gpa' => ['nullable', 'numeric', 'min:0', 'max:4.00'],
            'enrollment_date' => ['nullable', 'date'],
            'graduation_date' => ['nullable', 'date'],
            'photo' => ['nullable', File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max('2mb')],
        ]);

        $oldPhotoPath = $student->photo_path;
        $newPhotoPath = $request->file('photo')?->store('student-photos', 'public');

        try {
            DB::transaction(function () use ($student, $validated, $newPhotoPath) {
                $student->user->update([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'is_active' => $validated['enrollment_status'] !== 'suspended',
                ]);

                $student->update([
                    'matric_no' => $validated['matric_no'],
                    'program_id' => $validated['program_id'],
                    'academic_year' => $validated['academic_year'] ?? null,
                    'current_semester' => $validated['current_semester'],
                    'phone' => $validated['phone'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'date_of_birth' => $validated['date_of_birth'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'photo_path' => $newPhotoPath ?? $student->photo_path,
                    'fee_status' => $validated['fee_status'],
                    'enrollment_status' => $validated['enrollment_status'],
                    'gpa' => $validated['gpa'] ?? null,
                    'enrollment_date' => $validated['enrollment_date'] ?? null,
                    'graduation_date' => $validated['graduation_date'] ?? null,
                ]);
            });
        } catch (Throwable $exception) {
            if ($newPhotoPath) {
                Storage::disk('public')->delete($newPhotoPath);
            }

            throw $exception;
        }

        if ($newPhotoPath && $oldPhotoPath) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return redirect()->route('admin.students.show', $student->id)
            ->with('success', 'Student details updated successfully.');
    }

    /**
     * Soft delete student and deactivate account.
     */
    public function destroy(int $id): RedirectResponse
    {
        $student = Student::with('user')->findOrFail($id);

        DB::transaction(function () use ($student) {
            if ($student->user) {
                $student->user->update(['is_active' => false]);
            }
            $student->delete();
        });

        return redirect()->route('admin.students.index')
            ->with('success', 'Student record deleted successfully.');
    }

    /**
     * Toggle student status between enrolled and suspended.
     */
    public function toggleStatus(int $id): RedirectResponse
    {
        $student = Student::with('user')->findOrFail($id);

        $newStatus = $student->enrollment_status === 'suspended' ? 'enrolled' : 'suspended';

        DB::transaction(function () use ($student, $newStatus) {
            $student->update(['enrollment_status' => $newStatus]);
            if ($student->user) {
                $student->user->update(['is_active' => $newStatus === 'enrolled']);
            }
        });

        $message = $newStatus === 'suspended' ? 'Student account suspended.' : 'Student account activated.';

        return back()->with('success', $message);
    }

    /**
     * Reset student password.
     */
    public function resetPassword(Request $request, int $id): RedirectResponse
    {
        $student = Student::with('user')->findOrFail($id);

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $student->user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Student password reset successfully.');
    }

    /**
     * Create a fee invoice for the student.
     */
    public function storeInvoice(Request $request, int $id): RedirectResponse
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:tuition,registration,exam,lab,library,other'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['nullable', 'date'],
        ]);

        $invoiceNo = 'INV-'.date('Y').'-'.strtoupper(Str::random(6));

        StudentInvoice::create([
            'student_id' => $student->id,
            'invoice_no' => $invoiceNo,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'paid_amount' => 0.00,
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'unpaid',
        ]);

        $student->recalculateFinancials();

        return back()->with('success', 'Fee invoice added successfully.');
    }

    /**
     * Record a payment for the student.
     */
    public function storePayment(
        Request $request,
        int $id,
        ManageStudentPayment $manageStudentPayment,
    ): RedirectResponse {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'invoice_id' => [
                'required',
                Rule::exists('student_invoices', 'id')->where(
                    fn ($query) => $query->where('student_id', $student->id),
                ),
            ],
            'amount' => ['required', 'numeric', 'min:1'],
            'payment_method' => ['required', 'string', Rule::in(PaymentMethod::values())],
            'payment_date' => ['required', 'date'],
            'status' => ['nullable', 'string', Rule::in(PaymentStatus::values())],
            'notes' => ['nullable', 'string', 'max:500'],
            'receipt' => ['nullable', 'file', 'max:5120'], // 5MB max
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('receipts', 'public');
        }

        $manageStudentPayment->record($student, [
            ...$validated,
            'status' => $validated['status'] ?? PaymentStatus::Paid->value,
            'receipt_path' => $receiptPath,
        ]);

        return back()->with('success', 'Payment recorded successfully.');
    }

    /**
     * Update payment approval status.
     */
    public function updatePaymentStatus(
        Request $request,
        int $id,
        int $paymentId,
        ManageStudentPayment $manageStudentPayment,
    ): RedirectResponse {
        $student = Student::findOrFail($id);
        $payment = StudentPayment::where('student_id', $student->id)->findOrFail($paymentId);

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(PaymentStatus::values())],
        ]);

        $manageStudentPayment->changeStatus(
            $payment,
            PaymentStatus::from($validated['status']),
        );

        return back()->with('success', "Payment {$validated['status']} successfully.");
    }

    /**
     * Upload and store a student document.
     */
    public function storeDocument(Request $request, int $id): RedirectResponse
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:admission,identity,academic,financial,other'],
            'file' => ['required', 'file', 'max:10240'], // 10MB
        ]);

        $file = $request->file('file');
        $path = $file->store('student_documents/'.$student->id, 'public');

        StudentDocument::create([
            'student_id' => $student->id,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'file_path' => $path,
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return back()->with('success', 'Document uploaded successfully.');
    }

    /**
     * Delete a student document.
     */
    public function destroyDocument(int $id, int $documentId): RedirectResponse
    {
        $student = Student::findOrFail($id);
        $document = StudentDocument::where('student_id', $student->id)->findOrFail($documentId);

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return back()->with('success', 'Document deleted successfully.');
    }

    /**
     * Generate / Issue certificate for student.
     */
    public function generateCertificate(Request $request, int $id): RedirectResponse
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:degree,diploma,completion,honor,other'],
            'issue_date' => ['required', 'date'],
        ]);

        $certificateNo = 'CERT-'.date('Y').'-'.strtoupper(Str::random(6));

        StudentCertificate::create([
            'student_id' => $student->id,
            'certificate_no' => $certificateNo,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'issue_date' => $validated['issue_date'],
            'status' => 'active',
        ]);

        return back()->with('success', 'Certificate generated and issued successfully.');
    }

    /**
     * Add course grade.
     */
    public function storeGrade(Request $request, int $id): RedirectResponse
    {
        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'course_code' => ['required', 'string', 'max:20'],
            'course_name' => ['required', 'string', 'max:255'],
            'semester' => ['required', 'integer', 'min:1', 'max:'.config('academic.total_semesters')],
            'credits' => ['required', 'integer', 'min:1', 'max:6'],
            'grade' => ['nullable', 'string', 'max:5'],
            'grade_point' => ['nullable', 'numeric', 'min:0', 'max:4.00'],
            'status' => ['required', 'string', 'in:passed,failed,in_progress'],
        ]);

        StudentGrade::updateOrCreate(
            [
                'student_id' => $student->id,
                'course_code' => $validated['course_code'],
            ],
            $validated,
        );

        $student->recalculateGpa();

        return back()->with('success', 'Course grade recorded successfully.');
    }

    /**
     * Delete course grade.
     */
    public function destroyGrade(int $id, int $gradeId): RedirectResponse
    {
        $student = Student::findOrFail($id);
        $grade = StudentGrade::where('student_id', $student->id)->findOrFail($gradeId);

        $grade->delete();
        $student->recalculateGpa();

        return back()->with('success', 'Course grade deleted successfully.');
    }
}
