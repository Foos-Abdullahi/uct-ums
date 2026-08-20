<?php

use App\Enums\UserRole;
use App\Models\Admission;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Index ────────────────────────────────────────────────────────────────────

test('admin can view the admissions index page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.admissions.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/admissions/index'));
});

test('admin sees programs and filters on the admissions index', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    Program::factory()->count(3)->create();

    $response = $this->get(route('admin.admissions.index'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('programs')
                ->has('filters')
        );
});

// ─── Create ───────────────────────────────────────────────────────────────────

test('admin can view the create admission form', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.admissions.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/admissions/create'));
});

// ─── Show ─────────────────────────────────────────────────────────────────────

test('admin can view an individual admission application', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->create();

    $response = $this->get(route('admin.admissions.show', $admission));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/admissions/show')
                ->has('admission')
                ->where('admission.id', $admission->id)
        );
});

// ─── Store ────────────────────────────────────────────────────────────────────

test('admin can submit a new admission application', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $program = Program::factory()->create();

    $response = $this->post(route('admin.admissions.store'), [
        'first_name' => 'Hassan',
        'last_name' => 'Jama',
        'email' => 'hassan.jama@example.com',
        'phone' => '+252615550001',
        'gender' => 'Male',
        'date_of_birth' => '2000-05-15',
        'address' => 'Mogadishu, Somalia',
        'program_id' => $program->id,
        'entry_semester' => 'Semester 1',
        'previous_qualification' => 'National High School Certificate',
        'previous_gpa' => '3.75',
        'notes' => 'Eager applicant.',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('admissions', [
        'email' => 'hassan.jama@example.com',
        'first_name' => 'Hassan',
        'last_name' => 'Jama',
        'status' => 'pending',
    ]);
});

test('store admission validates required fields', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.admissions.store'), []);

    $response->assertSessionHasErrors(['first_name', 'last_name', 'email', 'program_id']);
});

test('admission application is created with auto-generated application number', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $program = Program::factory()->create();

    $this->post(route('admin.admissions.store'), [
        'first_name' => 'Ayan',
        'last_name' => 'Mohamed',
        'email' => 'ayan@example.com',
        'program_id' => $program->id,
    ]);

    $admission = Admission::where('email', 'ayan@example.com')->first();

    expect($admission)->not->toBeNull()
        ->and($admission->application_no)->toStartWith('ADM-');
});

// ─── Update Status ────────────────────────────────────────────────────────────

test('admin can approve an admission application', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->create(['status' => 'pending']);

    $response = $this->patch(route('admin.admissions.update-status', $admission), [
        'status' => 'approved',
        'review_notes' => 'All documents verified.',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('admissions', [
        'id' => $admission->id,
        'status' => 'approved',
    ]);
});

test('admin can reject an admission application with notes', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->create(['status' => 'pending']);

    $response = $this->patch(route('admin.admissions.update-status', $admission), [
        'status' => 'rejected',
        'review_notes' => 'Does not meet minimum GPA requirements.',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('admissions', [
        'id' => $admission->id,
        'status' => 'rejected',
        'review_notes' => 'Does not meet minimum GPA requirements.',
    ]);
});

test('admission review rejects invalid status values', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->create();

    $response = $this->patch(route('admin.admissions.update-status', $admission), [
        'status' => 'invalid_status',
    ]);

    $response->assertSessionHasErrors(['status']);
});

test('admin can mark an application as under review', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->create(['status' => 'pending']);

    $this->patch(route('admin.admissions.update-status', $admission), [
        'status' => 'under_review',
        'review_notes' => 'Documents are being reviewed.',
    ]);

    $this->assertDatabaseHas('admissions', [
        'id' => $admission->id,
        'status' => 'under_review',
    ]);
});

// ─── Convert to Student ───────────────────────────────────────────────────────

test('admin can convert an approved admission into a student account', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->approved()->create([
        'email' => 'convert.test@example.com',
    ]);

    $response = $this->post(route('admin.admissions.convert', $admission));

    $response->assertRedirect();

    $user = User::where('email', 'convert.test@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Student);

    $student = Student::where('user_id', $user->id)->first();

    expect($student)->not->toBeNull()
        ->and($student->matric_no)->toStartWith('UCT-');

    $this->assertDatabaseHas('admissions', [
        'id' => $admission->id,
        'status' => 'enrolled',
        'student_id' => $student->id,
    ]);
});

test('conversion creates default tuition invoice for the new student', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->approved()->create([
        'email' => 'invoice.test@example.com',
    ]);

    $this->post(route('admin.admissions.convert', $admission));

    $user = User::where('email', 'invoice.test@example.com')->first();
    $student = Student::where('user_id', $user->id)->first();

    $this->assertDatabaseHas('student_invoices', [
        'student_id' => $student->id,
        'type' => 'tuition',
    ]);
});

test('converting an already-enrolled admission redirects to student profile', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $existingStudent = Student::factory()->create();
    $admission = Admission::factory()->enrolled()->create([
        'student_id' => $existingStudent->id,
    ]);

    $response = $this->post(route('admin.admissions.convert', $admission));

    // Should redirect (back to student, not create a new one)
    $response->assertRedirect();

    // Only the original student should exist
    $this->assertDatabaseCount('students', 1);
});

// ─── Delete ───────────────────────────────────────────────────────────────────

test('admin can delete an admission application', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);
    $admission = Admission::factory()->create();

    $response = $this->delete(route('admin.admissions.destroy', $admission));

    $response->assertRedirect(route('admin.admissions.index'));

    $this->assertSoftDeleted('admissions', ['id' => $admission->id]);
});

// ─── Authorization ────────────────────────────────────────────────────────────

test('unauthenticated users cannot access admissions routes', function () {
    $response = $this->get(route('admin.admissions.index'));

    $response->assertRedirect(route('login'));
});

test('student role users cannot access admin admissions routes', function () {
    $student = Student::factory()->create();
    $this->actingAs($student->user);

    $response = $this->get(route('admin.admissions.index'));

    $response->assertForbidden();
});

test('registrar role cannot access admin admissions routes', function () {
    $registrar = User::factory()->role(UserRole::Registrar)->create();
    $this->actingAs($registrar);

    $response = $this->get(route('admin.admissions.index'));

    $response->assertForbidden();
});
