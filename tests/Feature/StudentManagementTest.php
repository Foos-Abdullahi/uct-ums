<?php

use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// ─── Index ────────────────────────────────────────────────────────────────────

test('admin can view the students index page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.students.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/students/index'));
});

test('admin sees programs and filters on the students index', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    Program::factory()->count(2)->create();

    $response = $this->get(route('admin.students.index'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('programs')
                ->has('filters')
        );
});

// ─── Create ───────────────────────────────────────────────────────────────────

test('admin can view the create student form', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.students.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/students/create'));
});

test('admin can create a new student with auto-generated matric number', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $program = Program::factory()->create();

    $response = $this->post(route('admin.students.store'), [
        'name' => 'Fatima Ali',
        'email' => 'fatima.ali@example.com',
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
    expect($user)->not->toBeNull()->and($user->role)->toBe(UserRole::Student);

    $student = Student::where('user_id', $user->id)->first();
    expect($student)->not->toBeNull()
        ->and($student->matric_no)->toStartWith('UCT-');
});

test('student creation validates required fields', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.students.store'), []);

    $response->assertSessionHasErrors(['name', 'email', 'program_id']);
});

test('student creation enforces unique email', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $program = Program::factory()->create();
    User::factory()->create(['email' => 'duplicate@example.com']);

    $response = $this->post(route('admin.students.store'), [
        'name' => 'Dupe User',
        'email' => 'duplicate@example.com',
        'program_id' => $program->id,
        'current_semester' => 1,
        'enrollment_status' => 'enrolled',
    ]);

    $response->assertSessionHasErrors(['email']);
});

// ─── Show ─────────────────────────────────────────────────────────────────────

test('admin can view a student profile page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->create(['student_id' => $student->id]);
    StudentPayment::factory()->approved()->create([
        'student_id' => $student->id,
        'invoice_id' => $invoice->id,
    ]);

    $response = $this->get(route('admin.students.show', $student));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/students/show')
                ->has('student')
                ->where('student.id', $student->id)
                ->has('student.invoices')
                ->has('student.payments')
                ->has('financialSummary')
                ->has('academicSummary')
                ->has('attendanceSummary')
        );
});

// ─── Edit & Update ────────────────────────────────────────────────────────────

test('admin can view the edit student form', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();

    $response = $this->get(route('admin.students.edit', $student));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/students/edit'));
});

test('admin can update student profile', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create(['current_semester' => 1]);

    $response = $this->put(route('admin.students.update', $student), [
        'name' => 'Updated Name',
        'email' => $student->user->email,
        'matric_no' => $student->matric_no,
        'program_id' => $student->program_id,
        'current_semester' => 3,
        'enrollment_status' => 'enrolled',
        'fee_status' => 'unpaid',
        'phone' => '+252615550001',
        'gender' => 'Male',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('students', [
        'id' => $student->id,
        'current_semester' => 3,
    ]);
});

// ─── Toggle Status ────────────────────────────────────────────────────────────

test('admin can suspend an enrolled student', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create(['enrollment_status' => 'enrolled']);

    $response = $this->post(route('admin.students.toggle-status', $student));

    $response->assertRedirect();
    $this->assertDatabaseHas('students', [
        'id' => $student->id,
        'enrollment_status' => 'suspended',
    ]);
});

test('admin can reactivate a suspended student', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
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
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
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
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.invoices.store', $student), [
        'title' => 'Semester 2 Tuition Fee',
        'type' => 'tuition',
        'amount' => 1500.00,
        'due_date' => now()->addDays(30)->toDateString(),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_invoices', [
        'student_id' => $student->id,
        'title' => 'Semester 2 Tuition Fee',
        'type' => 'tuition',
    ]);
});

test('invoice creation validates required fields', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.invoices.store', $student), []);

    $response->assertSessionHasErrors(['title', 'type', 'amount']);
});

// ─── Payments ─────────────────────────────────────────────────────────────────

test('admin can record a student payment', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->for($student)->create(['amount' => 1000.00]);

    $response = $this->post(route('admin.students.payments.store', $student), [
        'invoice_id' => $invoice->id,
        'amount' => 500.00,
        'payment_method' => 'bank_transfer',
        'payment_date' => now()->toDateString(),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_payments', [
        'student_id' => $student->id,
        'amount' => 500.00,
        'payment_method' => 'bank_transfer',
    ]);
});

test('admin can approve a pending payment', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();
    $invoice = StudentInvoice::factory()->for($student)->create(['amount' => 1000.00]);
    $payment = StudentPayment::factory()->for($student)->create([
        'invoice_id' => $invoice->id,
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
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.grades.store', $student), [
        'course_name' => 'Introduction to Computer Science',
        'course_code' => 'CS101',
        'semester' => 1,
        'credits' => 3,
        'grade' => 'A',
        'grade_point' => 4.0,
        'status' => 'passed',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_grades', [
        'student_id' => $student->id,
        'course_code' => 'CS101',
        'grade' => 'A',
    ]);
});

test('admin can delete a grade record', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
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
    Storage::fake('public');
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $student = Student::factory()->create();

    $response = $this->post(route('admin.students.documents.store', $student), [
        'title' => 'Official Transcript',
        'category' => 'academic',
        'file' => UploadedFile::fake()->create('transcript.pdf', 200, 'application/pdf'),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('student_documents', [
        'student_id' => $student->id,
        'title' => 'Official Transcript',
        'category' => 'academic',
    ]);
});

// ─── Delete ───────────────────────────────────────────────────────────────────

test('admin can delete a student record', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
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

test('finance role cannot access admin student management routes', function () {
    $finance = User::factory()->role(UserRole::Finance)->create();
    $this->actingAs($finance);

    $response = $this->get(route('admin.students.index'));

    $response->assertForbidden();
});
