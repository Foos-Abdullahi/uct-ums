<?php

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentCertificate;
use App\Models\StudentDocument;
use App\Models\StudentGrade;
use App\Models\StudentInvoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->program = Program::factory()->create();

    $this->studentUser = User::factory()->role(UserRole::Student)->create();
    $this->student = Student::factory()->paid()->create([
        'user_id' => $this->studentUser->id,
        'program_id' => $this->program->id,
        'current_semester' => 1,
    ]);
});

// ── Access Control ──────────────────────────────────────────────────────────

test('unauthenticated guest cannot access student portal', function () {
    $this->get(route('student.dashboard'))->assertRedirect(route('login'));
});

test('lecturer cannot access student portal', function () {
    $lecturerUser = User::factory()->role(UserRole::Lecturer)->create();
    $this->actingAs($lecturerUser)
        ->get(route('student.dashboard'))
        ->assertForbidden();
});

test('unpaid student is redirected to fees locked page', function () {
    $student = Student::factory()->create(['fee_status' => FeeStatus::Unpaid]);
    $this->actingAs($student->user)
        ->get(route('student.dashboard'))
        ->assertRedirect(route('student.fees.locked'));
});

// ── Dashboard ───────────────────────────────────────────────────────────────

test('student can access dashboard with stats', function () {
    $this->actingAs($this->studentUser)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/dashboard')
                ->has('student')
                ->has('stats')
                ->has('courses')
                ->has('recent_grades')
        );
});

test('dashboard shows current semester courses for the students program', function () {
    Course::factory()->create([
        'program_id' => $this->program->id,
        'semester' => 1,
        'status' => 'active',
    ]);
    Course::factory()->create([
        'program_id' => $this->program->id,
        'semester' => 2, // different semester — should not appear
        'status' => 'active',
    ]);

    $this->actingAs($this->studentUser)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/dashboard')
                ->has('courses', 1)  // only sem 1 course
        );
});

// ── Courses ─────────────────────────────────────────────────────────────────

test('student can view their enrolled courses', function () {
    Course::factory()->count(3)->create([
        'program_id' => $this->program->id,
        'semester' => 1,
        'status' => 'active',
    ]);

    $this->actingAs($this->studentUser)
        ->get(route('student.courses.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/courses/index')
                ->has('courses', 3)
        );
});

// ── Grades ───────────────────────────────────────────────────────────────────

test('student can view their grades', function () {
    StudentGrade::factory()->create([
        'student_id' => $this->student->id,
        'semester' => 1,
        'grade' => 'A',
        'grade_point' => 4.0,
        'status' => 'passed',
        'credits' => 3,
    ]);

    $this->actingAs($this->studentUser)
        ->get(route('student.grades.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/grades/index')
                ->has('grades_by_semester', 1)
                ->has('stats')
                ->where('stats.passed', 1)
        );
});

test('student can filter grades by semester', function () {
    StudentGrade::factory()->create(['student_id' => $this->student->id, 'semester' => 1]);
    StudentGrade::factory()->create(['student_id' => $this->student->id, 'semester' => 2]);

    $this->actingAs($this->studentUser)
        ->get(route('student.grades.index', ['semester' => 1]))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page->has('grades_by_semester', 1)
        );
});

// ── Attendance ───────────────────────────────────────────────────────────────

test('student can view their attendance records', function () {
    StudentAttendance::factory()->count(5)->create([
        'student_id' => $this->student->id,
        'status' => 'present',
    ]);

    $this->actingAs($this->studentUser)
        ->get(route('student.attendance.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/attendance/index')
                ->has('attendances', 5)
                ->has('overall_rate')
        );
});

// ── Fees ─────────────────────────────────────────────────────────────────────

test('student can view their fees and invoices', function () {
    StudentInvoice::factory()->create([
        'student_id' => $this->student->id,
        'amount' => 1500,
        'paid_amount' => 1500,
        'status' => 'paid',
    ]);

    $this->actingAs($this->studentUser)
        ->get(route('student.fees.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/fees/index')
                ->has('invoices', 1)
                ->has('summary')
                ->where('summary.total_invoiced', 1500)
        );
});

// ── Documents ────────────────────────────────────────────────────────────────

test('student can view their documents', function () {
    StudentDocument::factory()->count(2)->create([
        'student_id' => $this->student->id,
    ]);

    $this->actingAs($this->studentUser)
        ->get(route('student.documents.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/documents/index')
                ->has('documents', 2)
        );
});

// ── Certificates ─────────────────────────────────────────────────────────────

test('student can view their certificates', function () {
    StudentCertificate::factory()->count(1)->create([
        'student_id' => $this->student->id,
    ]);

    $this->actingAs($this->studentUser)
        ->get(route('student.certificates.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Student/certificates/index')
                ->has('certificates', 1)
        );
});

test('student cannot see another student certificates', function () {
    $other = Student::factory()->paid()->create();
    StudentCertificate::factory()->count(2)->create(['student_id' => $other->id]);

    $this->actingAs($this->studentUser)
        ->get(route('student.certificates.index'))
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page->has('certificates', 0)
        );
});
