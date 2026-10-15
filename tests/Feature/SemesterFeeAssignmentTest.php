<?php

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->role(UserRole::SuperAdmin)->create());
});

test('semester fee is assigned to every matching enrolled student', function () {
    $program = Program::factory()->create();
    $eligibleStudents = Student::factory()->count(3)->create([
        'program_id' => $program->id,
        'academic_year' => '2026/2027',
        'current_semester' => 2,
        'enrollment_status' => 'enrolled',
        'fee_status' => FeeStatus::Paid,
    ]);
    Student::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2026/2027',
        'current_semester' => 3,
    ]);
    Student::factory()->suspended()->create([
        'program_id' => $program->id,
        'academic_year' => '2026/2027',
        'current_semester' => 2,
    ]);

    $response = $this->post(route('admin.finance.fees.semester.store'), [
        'academic_year' => '2026/2027',
        'semester' => 2,
        'program_id' => $program->id,
        'title' => 'Semester 2 Tuition Fee',
        'type' => 'tuition',
        'amount' => 450,
        'due_date' => '2026-11-30',
    ]);

    $response->assertRedirect()->assertSessionHas('success');

    expect(StudentInvoice::count())->toBe(3);

    foreach ($eligibleStudents as $student) {
        $invoice = StudentInvoice::whereBelongsTo($student)->sole();

        expect($invoice->academic_year)->toBe('2026/2027')
            ->and($invoice->semester)->toBe(2)
            ->and($invoice->type)->toBe('tuition')
            ->and($invoice->amount)->toBe('450.00')
            ->and($invoice->due_date->toDateString())->toBe('2026-11-30')
            ->and($student->fresh()->fee_status)->toBe(FeeStatus::Partial);
    }
});

test('repeating a semester fee safely skips existing student charges', function () {
    $student = Student::factory()->create([
        'academic_year' => '2026/2027',
        'current_semester' => 1,
        'enrollment_status' => 'enrolled',
    ]);
    $payload = [
        'academic_year' => '2026/2027',
        'semester' => 1,
        'title' => 'Semester 1 Tuition Fee',
        'type' => 'tuition',
        'amount' => 450,
    ];

    $this->post(route('admin.finance.fees.semester.store'), $payload)->assertSessionHas('success');
    $this->post(route('admin.finance.fees.semester.store'), $payload)
        ->assertSessionHas('success', fn (string $message) => str_contains($message, '1 existing assignments'));

    expect(StudentInvoice::whereBelongsTo($student)->count())->toBe(1);
});

test('semester fee can target all programs in the selected semester', function () {
    Student::factory()->count(2)->create([
        'academic_year' => '2026/2027',
        'current_semester' => 4,
        'enrollment_status' => 'enrolled',
    ]);

    $this->post(route('admin.finance.fees.semester.store'), [
        'academic_year' => '2026/2027',
        'semester' => 4,
        'program_id' => null,
        'title' => 'Semester 4 Examination Fee',
        'type' => 'exam',
        'amount' => 50,
    ])->assertSessionHas('success');

    expect(StudentInvoice::where('semester', 4)->where('type', 'exam')->count())->toBe(2);
});

test('semester fee validates its academic context', function () {
    $this->post(route('admin.finance.fees.semester.store'), [
        'academic_year' => '2026',
        'semester' => 0,
        'title' => '',
        'type' => 'unknown',
        'amount' => 0,
    ])->assertSessionHasErrors([
        'academic_year',
        'semester',
        'title',
        'type',
        'amount',
    ]);
});
