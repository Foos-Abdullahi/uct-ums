<?php

use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('admin can create a student with a profile photo', function () {
    Storage::fake('public');

    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $program = Program::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.students.store'), [
            'name' => 'Asha Ali',
            'email' => 'asha@example.com',
            'program_id' => $program->id,
            'initial_fee_amount' => 0,
            'photo' => UploadedFile::fake()->image('asha.jpg', 600, 600)->size(500),
        ])
        ->assertRedirect();

    $student = Student::whereHas('user', fn ($query) => $query->where('email', 'asha@example.com'))->firstOrFail();

    expect($student->photo_path)->not->toBeNull()
        ->and($student->photo_url)->toBe('/storage/'.$student->photo_path);
    Storage::disk('public')->assertExists($student->photo_path);
});

test('replacing a student photo removes the previous file', function () {
    Storage::fake('public');

    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = Student::factory()->paid()->create(['photo_path' => 'student-photos/old.jpg']);
    Storage::disk('public')->put($student->photo_path, 'old-photo');

    $this->actingAs($admin)
        ->post(route('admin.students.update', $student), [
            '_method' => 'put',
            'name' => $student->user->name,
            'email' => $student->user->email,
            'matric_no' => $student->matric_no,
            'program_id' => $student->program_id,
            'current_semester' => $student->current_semester,
            'fee_status' => $student->fee_status->value,
            'enrollment_status' => $student->enrollment_status,
            'photo' => UploadedFile::fake()->image('new-photo.png', 600, 600)->size(400),
        ])
        ->assertRedirect(route('admin.students.show', $student));

    $newPhotoPath = $student->fresh()->photo_path;

    expect($newPhotoPath)->not->toBe('student-photos/old.jpg');
    Storage::disk('public')->assertMissing('student-photos/old.jpg');
    Storage::disk('public')->assertExists($newPhotoPath);

    $photoUrl = '/storage/'.$newPhotoPath;

    $this->get(route('admin.students.show', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('student.photo_url', $photoUrl));

    $this->get(route('admin.students.edit', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('student.photo_url', $photoUrl));

    $this->get(route('admin.students.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('students.data.0.photo_url', $photoUrl)));

    $this->actingAs($student->user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('student.photo_url', $photoUrl));
});

test('student photo upload rejects unsupported files and files over two megabytes', function () {
    Storage::fake('public');

    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $program = Program::factory()->create();

    $baseData = [
        'name' => 'Asha Ali',
        'email' => 'asha@example.com',
        'program_id' => $program->id,
        'initial_fee_amount' => 0,
    ];

    $this->actingAs($admin)
        ->post(route('admin.students.store'), [
            ...$baseData,
            'photo' => UploadedFile::fake()->create('student.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('photo');

    $this->post(route('admin.students.store'), [
        ...$baseData,
        'email' => 'asha-large@example.com',
        'photo' => UploadedFile::fake()->image('large.jpg')->size(2100),
    ])->assertSessionHasErrors('photo');
});

test('finance statement includes the student photo and a running transaction balance', function () {
    Storage::fake('public');

    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $student = Student::factory()->create(['photo_path' => 'student-photos/student.jpg']);
    $invoice = StudentInvoice::factory()->create([
        'student_id' => $student->id,
        'amount' => 500,
        'paid_amount' => 200,
        'title' => 'Semester Tuition',
        'issue_date' => '2026-10-01',
    ]);
    StudentPayment::factory()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
        'amount' => 200,
        'status' => PaymentStatus::Paid->value,
        'payment_date' => '2026-10-02',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.students.finance-statement', $student))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/students/finance-statement')
            ->where('student.photo_url', '/storage/student-photos/student.jpg')
            ->where('totals.charged', 500)
            ->where('totals.paid', 200)
            ->where('totals.balance', -300)
            ->has('statement', 2)
            ->where('statement.0.balance', -500)
            ->where('statement.1.balance', -300));
});
