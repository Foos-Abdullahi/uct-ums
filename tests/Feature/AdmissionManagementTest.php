<?php

use App\Enums\UserRole;
use App\Models\Admission;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

/**
 * Helper: create and authenticate a Super Admin user.
 */
function actingAsSuperAdmin(): User
{
    $user = User::factory()->role(UserRole::SuperAdmin)->create();
    test()->actingAs($user);

    return $user;
}

// ─── Index & Stats ──────────────────────────────────────────────────────────

test('admin can view the admissions index page', function () {
    actingAsSuperAdmin();

    $response = $this->get(route('admin.admissions.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/admissions/index'));
});

test('admin can fetch deferred admissions stats', function () {
    actingAsSuperAdmin();
    Admission::factory()->count(3)->create();
    Admission::factory()->approved()->count(2)->create();

    $response = $this->get(route('admin.admissions.index', ['only' => 'stats']));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('stats')
                ->where('stats.total_applications', fn ($val) => $val >= 5)
                ->where('stats.approved', fn ($val) => $val >= 2)
        );
});

test('admin can fetch deferred admissions table data', function () {
    actingAsSuperAdmin();
    Admission::factory()->count(5)->create();

    $response = $this->get(route('admin.admissions.index', ['only' => 'admissions']));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('admissions')
                ->has('admissions.data')
        );
});

test('admin can filter admissions by status', function () {
    actingAsSuperAdmin();
    Admission::factory()->count(3)->create(['status' => 'pending']);
    Admission::factory()->count(2)->approved()->create();

    $response = $this->get(route('admin.admissions.index', [
        'only' => 'admissions',
        'status' => 'pending',
    ]));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->where('admissions.total', fn ($val) => $val >= 3)
        );
});

// ─── Create / Show ──────────────────────────────────────────────────────────

test('admin can view the create admission form', function () {
    actingAsSuperAdmin();

    $response = $this->get(route('admin.admissions.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/admissions/create'));
});

test('admin can view an individual admission application', function () {
    actingAsSuperAdmin();
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

// ─── Store ───────────────────────────────────────────────────────────────────

test('admin can submit a new admission application', function () {
    actingAsSuperAdmin();
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
    actingAsSuperAdmin();

    $response = $this->post(route('admin.admissions.store'), []);

    $response->assertSessionHasErrors(['first_name', 'last_name', 'email', 'program_id']);
});

// ─── Review / Status ─────────────────────────────────────────────────────────

test('admin can approve an admission application', function () {
    actingAsSuperAdmin();
    $admission = Admission::factory()->create(['status' => 'pending']);

    $response = $this->patch(route('admin.admissions.update-status', $admission), [
        'status' => 'approved',
        'review_notes' => 'All documents verified, applicant meets requirements.',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('admissions', [
        'id' => $admission->id,
        'status' => 'approved',
    ]);
});

test('admin can reject an admission application with notes', function () {
    actingAsSuperAdmin();
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

test('admission review validates status enum', function () {
    actingAsSuperAdmin();
    $admission = Admission::factory()->create();

    $response = $this->patch(route('admin.admissions.update-status', $admission), [
        'status' => 'invalid_status',
    ]);

    $response->assertSessionHasErrors(['status']);
});

// ─── Convert to Student ──────────────────────────────────────────────────────

test('admin can convert an approved admission into a student account', function () {
    actingAsSuperAdmin();
    $admission = Admission::factory()->approved()->create([
        'email' => 'convert.test@example.com',
    ]);

    $response = $this->post(route('admin.admissions.convert', $admission), [
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect();

    /** @var User $user */
    $user = User::where('email', 'convert.test@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Student);

    $student = Student::where('user_id', $user->id)->first();

    expect($student)->not->toBeNull()
        ->and($student->matric_number)->toStartWith('UCT-');

    $this->assertDatabaseHas('admissions', [
        'id' => $admission->id,
        'status' => 'enrolled',
        'student_id' => $student->id,
    ]);
});

test('conversion creates default tuition invoice for the new student', function () {
    actingAsSuperAdmin();
    $admission = Admission::factory()->approved()->create([
        'email' => 'invoice.test@example.com',
    ]);

    $this->post(route('admin.admissions.convert', $admission), [
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'invoice.test@example.com')->first();
    $student = Student::where('user_id', $user->id)->first();

    $this->assertDatabaseHas('student_invoices', [
        'student_id' => $student->id,
    ]);
});

test('cannot convert an already-enrolled admission', function () {
    actingAsSuperAdmin();
    $admission = Admission::factory()->enrolled()->create();

    $response = $this->post(route('admin.admissions.convert', $admission), [
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect();

    // No new student should be linked beyond the original
    $this->assertDatabaseCount('students', $admission->student_id ? 1 : 0);
});

// ─── Delete ──────────────────────────────────────────────────────────────────

test('admin can delete an admission application', function () {
    actingAsSuperAdmin();
    $admission = Admission::factory()->create();

    $response = $this->delete(route('admin.admissions.destroy', $admission));

    $response->assertRedirect(route('admin.admissions.index'));

    $this->assertSoftDeleted('admissions', ['id' => $admission->id]);
});

// ─── Authorization ───────────────────────────────────────────────────────────

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
