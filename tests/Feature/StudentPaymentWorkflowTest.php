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

test('student profile and finance roster share one payment workflow', function () {
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 450,
        'paid_amount' => 0,
        'status' => 'unpaid',
    ]);

    $this->post(route('admin.students.payments.store', $student), [
        'invoice_id' => $invoice->id,
        'amount' => 450,
        'payment_method' => 'evc_plus',
        'payment_date' => '2026-10-18',
        'status' => 'pending',
    ])->assertSessionHas('success');

    $payment = StudentPayment::sole();

    expect($payment->status)->toBe('pending')
        ->and($invoice->fresh()->paid_amount)->toBe('0.00')
        ->and($student->fresh()->fee_status)->toBe(FeeStatus::Unpaid);

    $this->patch(route('admin.finance.payments.status', $payment), [
        'status' => 'paid',
    ])->assertSessionHas('success');

    expect($payment->fresh()->status)->toBe('paid')
        ->and($invoice->fresh()->paid_amount)->toBe('450.00')
        ->and($invoice->fresh()->status)->toBe('paid')
        ->and($student->fresh()->fee_status)->toBe(FeeStatus::Paid);

    $this->get(route('admin.students.show', $student))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/students/show')
            ->where('financialSummary.total_paid', fn ($value) => (float) $value === 450.0)
            ->where('financialSummary.total_outstanding', fn ($value) => (float) $value === 0.0));

    $this->actingAs($student->user);

    $this->get(route('student.fees.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/fees/index')
            ->where('summary.total_paid', fn ($value) => (float) $value === 450.0)
            ->where('summary.outstanding_balance', fn ($value) => (float) $value === 0.0)
            ->where('summary.fee_status', FeeStatus::Paid->value));
});

test('payment entry points enforce the canonical status and method vocabulary', function () {
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create(['student_id' => $student->id]);

    $this->post(route('admin.finance.payments.store'), [
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 50,
        'payment_method' => 'card',
        'payment_date' => '2026-10-18',
        'status' => 'approved',
    ])->assertSessionHasErrors(['payment_method', 'status']);

    expect(StudentPayment::count())->toBe(0);
});
