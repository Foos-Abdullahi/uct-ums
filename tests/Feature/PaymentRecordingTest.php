<?php

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->role(UserRole::SuperAdmin)->create());
});

test('payment can be applied to an outstanding invoice', function () {
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 450,
        'paid_amount' => 0,
        'status' => 'unpaid',
    ]);

    $this->post(route('admin.finance.payments.store'), [
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 200,
        'payment_method' => 'cash',
        'payment_date' => '2026-10-15',
        'status' => 'paid',
    ])->assertSessionHas('success');

    $payment = StudentPayment::sole();

    expect($payment->invoice_id)->toBe($invoice->id)
        ->and($invoice->fresh()->paid_amount)->toBe('200.00')
        ->and($invoice->fresh()->status)->toBe('partial')
        ->and($student->fresh()->fee_status)->toBe(FeeStatus::Partial);
});

test('rejecting a paid payment reverses its invoice balance', function () {
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 450,
        'paid_amount' => 200,
        'status' => 'partial',
    ]);
    $payment = StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 200,
        'status' => 'paid',
    ]);

    $this->patch(route('admin.finance.payments.status', $payment), [
        'status' => 'rejected',
    ])->assertSessionHas('success');

    expect($invoice->fresh()->paid_amount)->toBe('0.00')
        ->and($invoice->fresh()->status)->toBe('unpaid')
        ->and($student->fresh()->fee_status)->toBe(FeeStatus::Unpaid);
});

test('payment cannot exceed the selected invoice balance', function () {
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 450,
        'paid_amount' => 400,
        'status' => 'partial',
    ]);

    $this->post(route('admin.finance.payments.store'), [
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 51,
        'payment_method' => 'cash',
        'payment_date' => '2026-10-15',
        'status' => 'paid',
    ])->assertSessionHasErrors('amount');

    expect(StudentPayment::count())->toBe(0)
        ->and($invoice->fresh()->paid_amount)->toBe('400.00');
});

test('invoice selected for payment must belong to the student', function () {
    $student = Student::factory()->create();
    $otherInvoice = StudentInvoice::factory()->create();

    $this->post(route('admin.finance.payments.store'), [
        'student_id' => $student->id,
        'invoice_id' => $otherInvoice->id,
        'amount' => 50,
        'payment_method' => 'cash',
        'payment_date' => '2026-10-15',
        'status' => 'paid',
    ])->assertSessionHasErrors('invoice_id');

    expect(StudentPayment::count())->toBe(0);
});

test('pending payment cannot be marked paid after the invoice balance has been filled', function () {
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 450,
        'paid_amount' => 400,
        'status' => 'partial',
    ]);
    $payment = StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 100,
        'status' => 'pending',
    ]);

    $this->patch(route('admin.finance.payments.status', $payment), [
        'status' => 'paid',
    ])->assertSessionHasErrors('status');

    expect($payment->fresh()->status)->toBe('pending')
        ->and($invoice->fresh()->paid_amount)->toBe('400.00');
});

test('payments page provides outstanding invoices for recording', function () {
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 450,
        'paid_amount' => 100,
        'status' => 'partial',
    ]);

    $this->get(route('admin.finance.payments'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/finance/payments')
            ->has('students', 1)
            ->where('students.0.id', $student->id)
            ->where('students.0.invoices.0.id', $invoice->id)
            ->where('students.0.invoices.0.balance', 350));
});
