<?php

use App\Enums\FeeStatus;
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

test('finance statement produces an ordered chronological ledger with accurate running balance and totals', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $program = Program::factory()->create(['name' => 'Computer Science']);
    $student = Student::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2026-2027',
        'current_semester' => 2,
        'section' => 'A',
    ]);

    // First semester invoice: 1000 on 2026-09-01
    $invoice1 = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'invoice_no' => 'INV-2026-001',
        'title' => 'Tuition Fee Sem 1',
        'amount' => 1000,
        'paid_amount' => 1000,
        'issue_date' => '2026-09-01',
    ]);

    // Payment for first invoice: 1000 on 2026-09-05
    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice1->id,
        'transaction_no' => 'TXN-20260905-01',
        'amount' => 1000,
        'payment_date' => '2026-09-05',
        'status' => PaymentStatus::Paid->value,
    ]);

    // Second semester invoice: 1200 on 2026-10-01
    $invoice2 = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'invoice_no' => 'INV-2026-002',
        'title' => 'Tuition Fee Sem 2',
        'amount' => 1200,
        'paid_amount' => 500,
        'issue_date' => '2026-10-01',
    ]);

    // Partial payment for second invoice: 500 on 2026-10-10
    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice2->id,
        'transaction_no' => 'TXN-20261010-01',
        'amount' => 500,
        'payment_date' => '2026-10-10',
        'status' => PaymentStatus::Paid->value,
    ]);

    // Pending payment should be excluded from paid ledger
    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice2->id,
        'transaction_no' => 'TXN-PENDING',
        'amount' => 700,
        'payment_date' => '2026-10-15',
        'status' => PaymentStatus::Pending->value,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.finance-statement', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/students/finance-statement')
            ->where('student.matric_no', $student->matric_no)
            ->where('student.academic_year', '2026-2027')
            ->where('student.current_semester', 2)
            ->where('totals.charged', 2200)
            ->where('totals.paid', 1500)
            ->where('totals.balance', -700)
            ->has('statement', 4)
            // Entry 1: INV 1 charge 1000 -> balance -1000
            ->where('statement.0.reference', 'INV-2026-001')
            ->where('statement.0.charged', 1000)
            ->where('statement.0.paid', 0)
            ->where('statement.0.balance', -1000)
            // Entry 2: TXN 1 payment 1000 -> balance 0
            ->where('statement.1.reference', 'TXN-20260905-01')
            ->where('statement.1.charged', 0)
            ->where('statement.1.paid', 1000)
            ->where('statement.1.balance', 0)
            // Entry 3: INV 2 charge 1200 -> balance -1200
            ->where('statement.2.reference', 'INV-2026-002')
            ->where('statement.2.charged', 1200)
            ->where('statement.2.paid', 0)
            ->where('statement.2.balance', -1200)
            // Entry 4: TXN 2 payment 500 -> balance -700
            ->where('statement.3.reference', 'TXN-20261010-01')
            ->where('statement.3.charged', 0)
            ->where('statement.3.paid', 500)
            ->where('statement.3.balance', -700)
        );
});

test('admin student profile includes the finance statement data', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = Student::factory()->create();

    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 450,
        'paid_amount' => 450,
        'title' => 'Registration Fee',
        'issue_date' => '2026-10-01',
    ]);

    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 450,
        'status' => PaymentStatus::Paid->value,
        'payment_date' => '2026-10-02',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.show', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/students/show')
            ->has('financeStatement.statement', 2)
            ->where('financeStatement.statement.1.reason', 'Registration Fee')
            ->where('financeStatement.totals.charged', 450)
            ->where('financeStatement.totals.paid', 450)
            ->where('financeStatement.totals.balance', 0)
        );
});

test('student portal fees page includes statement ledger and totals', function () {
    $user = User::factory()->role(UserRole::Student)->create();
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'fee_status' => FeeStatus::Paid,
    ]);

    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 800,
        'paid_amount' => 800,
        'title' => 'Semester Fee',
        'issue_date' => '2026-10-01',
    ]);

    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 800,
        'status' => PaymentStatus::Paid->value,
        'payment_date' => '2026-10-05',
    ]);

    $this->actingAs($user)
        ->get(route('student.fees.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/fees/index')
            ->where('student.matric_no', $student->matric_no)
            ->has('financeStatement.statement', 2)
            ->where('financeStatement.totals.charged', 800)
            ->where('financeStatement.totals.paid', 800)
            ->where('financeStatement.totals.balance', 0)
        );
});

test('student can view official printable statement even if fee status is unpaid', function () {
    $user = User::factory()->role(UserRole::Student)->create();
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'fee_status' => FeeStatus::Unpaid,
    ]);

    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 1500,
        'paid_amount' => 0,
        'title' => 'Tuition Fee',
        'issue_date' => '2026-10-01',
    ]);

    $this->actingAs($user)
        ->get(route('student.fees.statement'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/fees/statement')
            ->where('student.matric_no', $student->matric_no)
            ->where('totals.charged', 1500)
            ->where('totals.paid', 0)
            ->where('totals.balance', -1500)
            ->has('statement', 1)
            ->where('statement.0.balance', -1500)
        );
});
