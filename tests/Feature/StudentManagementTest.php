<?php

use App\Enums\UserRole;
use App\Models\Admission;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

/**
 * Helper: create a Super Admin user and authenticate.
 */
function adminActor(): User
{
    $user = User::factory()->role(UserRole::SuperAdmin)->create();
    test()->actingAs($user);

    return $user;
}

// ─── Index & Deferred Data ───────────────────────────────────────────────────

test('admin can view the students index page', function () {
    adminActor();

    $response = $this->get(route('admin.students.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/students/index'));
});

test('admin can fetch deferred student stats', function () {
    adminActor();
    Student::factory()->count(4)->create();

    $response = $this->get(route('admin.students.index', ['only' => 'stats']));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('stats')
                ->where('stats.total_students', fn ($v) => $v >= 4)
        );
});

test('admin can fetch deferred paginated students', function () {
    adminActor();
    Student::factory()->count(5)->create();

    $response = $this->get(route('admin.students.index', ['only' => 'students']));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('students')
                ->has('students.data')
        );
});

test('admin can filter students by enrollment status', function () {
    adminActor();
    Student::factory()->count(3)->create(['enrollment_status' => 'enrolled']);
    Student::factory()->count(2)->create(['enrollment_status' => 'suspended']);

    $response = $this->get(route('admin.students.index', [
        'only' => 'students',
        'enrollment_status' => 'suspended',
    ]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->where('students.total', fn ($v) => $v >= 2));
});

// ─── Create & Store ───────────────────────────────────────────────────────────

test('admin can view the create student form', function () {
    adminActor();

    $response = $this->get(route('admin.students.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/students/create'));
});

test('admin can create a new student with auto-generated matric number', function () {
    adminActor();
    $program = Program::factory()->create();

    $response = $this->post(route('admin.students.store'), [
        'name' => 'Fatima Ali',
        'email' => 'fatima.ali@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'program_id' => $program->id,
        'current_semester' => 1,
        'gender' => 'Female',
        'date_of_birth' => '2001-03-10',
        'phone' => '+252615550099',
        'address' => 'Hargeisa, Somaliland',
        'enrollment_status' => 'enrolled',
    ]);

    $response->assertRedirect();

    $user = User::where('email', 'fatima.ali@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Student);

    $student = Student::where('user_id', $user->id)->first();

    expect($student)->not->toBeNull()
        ->and($student->matric_number)->toStartWith('UCT-');
});

test('student creation validates required fields', function () {
    adminActor();

    $response = $this->post(route('admin.students.store'), []);

    $response->assertSessionHasErrors(['name', 'email', 'password', 'program_id']);
});

test('student creation enforces unique email', function () {
    adminActor();
    $program = Program::factory()->create();
    $existingUser = User::factory()->create(['email' => 'duplicate@example.com']);

    $response = $this->post(route('admin.students.store'), [
        'name' => 'Dupe User',
        'email' => 'duplicate@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'program_id' => $program->id,
        'current_semester' => 1,
        'enrollment_status' => 'enrolled',
    ]);

    $response->assertSessionHasErrors(['email']);
});

// ─── Show ─────────────────────────────────────────────────────────────────────

test('admin can view a student profile page', function () {
    adminActor();
    $student = Student::factory()->create();

    $response = $this->get(route('admin.students.show', $student));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/students/show')
                ->has('student')
                ->where('student.id', $student->id)
        );
});

// ─── Edit & Update ────────────────────────────────────────────────────────────

test('admin can view the edit student form', function () {
    adminActor();
    $student = Student::factory()->create();

    $response = $this->get(route('admin.students.edit', $student));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/students/edit'));
});

test('admin can update student profile', function () {
    adminActor();
    $student = Student::factory()->create();

    $response = $this->put(route('admin.students.update', $student), [
        'name' => 'Updated Name',
        'email' => $student->user->email,
        'program_id' => $student->program_id,
        'current_semester' => 2,
        'enrollment_status' => 'enrolled',
        'phone' => '+252615550001',
        'gender' => 'Male',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('students', [
        'id' => $student->id,
        'current_semester' => 2,
    ]);
});

// ─── Toggle Status ────────────────────────────────────────────────────────────

test('admin can suspend an enrolled student', function () {
    adminActor();
    $student = Student::factory()->create(['enrollment_status' => 'enrolled']);

    $response = $this->post(route('admin.students.toggle-status', $student));

    $response->assertRedirect();
    $this->assertDatabaseHas('students', [
        'id' => $student->id,
        'enrollment_status' => 'suspended',
    ]);
});

test('admin can reactivate a suspended student', function () {
    adminActor();
    $student = Student::factory()->create(['enrollment_status' => 'suspended']);

    $response = $this->post(route('admin.students.toggle-status', $student));

    $response->assertRedirect();
    $this->assertDatabaseHas('students', [
        'id' => $student->id,
        'enrollment_status' => 'enrolled',
    ]);
});

// ─── Password Reset ───────────────────────────────────────────────────────────

test('admin can reset a student user password', function () {
    adminActor();
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.reset-password', $student), [
        'password' => 'NewPassword123',
        'password_confirmation' => 'NewPassword123',
    ]);

    $response->assertRedirect();

    $updatedUser = User::find($student->user_id);
    expect(Hash::check('NewPassword123', $updatedUser->password))->toBeTrue();
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

test('admin can create a student fee invoice', function () {
    adminActor();
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.invoices.store', $student), [
        'description' => 'Semester 2 Tuition Fee',
        'amount' => 1500.00,
        'due_date' => now()->addDays(30)->toDateString(),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_invoices', [
        'student_id' => $student->id,
        'description' => 'Semester 2 Tuition Fee',
    ]);
});

// ─── Payments ─────────────────────────────────────────────────────────────────

test('admin can record a student payment', function () {
    adminActor();
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->for($student)->create(['amount' => 1000.00]);

    $response = $this->post(route('admin.students.payments.store', $student), [
        'student_invoice_id' => $invoice->id,
        'amount' => 500.00,
        'payment_method' => 'bank_transfer',
        'reference_number' => 'REF-001-TEST',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_payments', [
        'student_id' => $student->id,
        'amount' => 500.00,
        'reference_number' => 'REF-001-TEST',
    ]);
});

test('admin can approve a pending payment', function () {
    adminActor();
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->for($student)->create(['amount' => 1000.00]);
    $payment = StudentPayment::factory()->for($student)->for($invoice)->create([
        'amount' => 1000.00,
        'status' => 'pending',
    ]);

    $response = $this->patch(route('admin.students.payments.status', [
        'student' => $student->id,
        'payment' => $payment->id,
    ]), ['status' => 'approved']);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_payments', [
        'id' => $payment->id,
        'status' => 'approved',
    ]);
});

// ─── Grades ───────────────────────────────────────────────────────────────────

test('admin can add a grade record for a student', function () {
    adminActor();
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.grades.store', $student), [
        'course_name' => 'Introduction to Computer Science',
        'course_code' => 'CS101',
        'semester' => 1,
        'credits' => 3,
        'grade' => 'A',
        'grade_points' => 4.0,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_grades', [
        'student_id' => $student->id,
        'course_code' => 'CS101',
        'grade' => 'A',
    ]);
});

test('admin can delete a grade record', function () {
    adminActor();
    $student = Student::factory()->create();
    $grade = StudentGrade::factory()->for($student)->create();

    $response = $this->delete(route('admin.students.grades.destroy', [
        'student' => $student->id,
        'grade' => $grade->id,
    ]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('student_grades', ['id' => $grade->id]);
});

// ─── Documents ────────────────────────────────────────────────────────────────

test('admin can upload a student document', function () {
    Storage::fake('private');
    adminActor();
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.documents.store', $student), [
        'document_type' => 'transcript',
        'description' => 'Official transcript',
        'file' => UploadedFile::fake()->create('transcript.pdf', 200, 'application/pdf'),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_documents', [
        'student_id' => $student->id,
        'document_type' => 'transcript',
    ]);
});

// ─── Delete ───────────────────────────────────────────────────────────────────

test('admin can delete a student record', function () {
    adminActor();
    $student = Student::factory()->create();

    $response = $this->delete(route('admin.students.destroy', $student));

    $response->assertRedirect(route('admin.students.index'));
    $this->assertSoftDeleted('students', ['id' => $student->id]);
});

// ─── Authorization ────────────────────────────────────────────────────────────

test('unauthenticated users cannot access admin students routes', function () {
    $response = $this->get(route('admin.students.index'));

    $response->assertRedirect(route('login'));
});

test('student role users cannot access admin student management routes', function () {
    $student = Student::factory()->create();
    $this->actingAs($student->user);

    $response = $this->get(route('admin.students.index'));

    $response->assertForbidden();
});
