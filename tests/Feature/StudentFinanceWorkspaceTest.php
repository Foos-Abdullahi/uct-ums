<?php

use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function financeWorkspaceStudent(): Student
{
    return Student::factory()->create([
        'program_id' => Program::factory()->create()->id,
        'academic_year' => '2026-2027',
        'current_semester' => 2,
    ]);
}

test('student finance search lists students and filters by search term', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = financeWorkspaceStudent();
    $student->user->update(['name' => 'Zainab Searchable']);
    financeWorkspaceStudent();

    $this->actingAs($admin)
        ->get(route('admin.finance.students', ['search' => 'Searchable']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/students')
            ->has('students.data', 1)
            ->where('students.data.0.id', $student->id)
            ->where('filters.search', 'Searchable'));
});

test('student finance workspace groups invoices and payments by semester', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = financeWorkspaceStudent();

    $past = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'academic_year' => '2026-2027',
        'semester' => 1,
        'type' => 'tuition',
        'amount' => 1000,
        'paid_amount' => 1000,
        'status' => 'paid',
    ]);
    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $past->id,
        'amount' => 1000,
        'status' => PaymentStatus::Paid->value,
    ]);
    StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'academic_year' => '2026-2027',
        'semester' => 2,
        'type' => 'tuition',
        'amount' => 1200,
        'paid_amount' => 200,
        'status' => 'partial',
    ]);
    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => null,
        'amount' => 50,
        'status' => PaymentStatus::Paid->value,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.finance.students.show', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/student-detail')
            ->where('summary.total_invoiced', 2200)
            ->where('summary.total_paid', 1200)
            ->where('summary.total_outstanding', 1000)
            ->has('semesters', 2)
            ->where('semesters.0.semester', 2)
            ->where('semesters.0.is_current', true)
            ->where('semesters.0.balance', 1000)
            ->where('semesters.1.semester', 1)
            ->where('semesters.1.status', 'paid')
            ->has('semesters.1.payments', 1)
            ->has('unallocatedPayments', 1)
            ->has('openInvoices', 1));
});

test('current semester is shown even when no fees were issued for it', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = financeWorkspaceStudent();

    $this->actingAs($admin)
        ->get(route('admin.finance.students.show', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('semesters', 1)
            ->where('semesters.0.is_current', true)
            ->where('semesters.0.status', 'none'));
});

test('student finance workspace requires finance permission', function () {
    $student = financeWorkspaceStudent();
    $studentUser = User::factory()->role(UserRole::Student)->create();

    $this->actingAs($studentUser)
        ->get(route('admin.finance.students.show', $student))
        ->assertForbidden();
});

test('student profile reports real attendance and no rate when nothing is recorded', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = financeWorkspaceStudent();

    $this->actingAs($admin)
        ->get(route('admin.students.show', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('attendanceSummary.total_classes', 0)
            ->where('attendanceSummary.attendance_rate', null)
            ->has('currentSemesterFinance'));
});
