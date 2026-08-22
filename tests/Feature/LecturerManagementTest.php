<?php

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

// ─── Index ────────────────────────────────────────────────────────────────────

test('admin can view the lecturers index page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.lecturers.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/lecturers/index'));
});

test('admin sees departments and filters on the lecturers index', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    Lecturer::factory()->count(3)->create();

    $response = $this->get(route('admin.lecturers.index'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('departments')
                ->has('filters')
        );
});

test('admin can search lecturers by name, email, and lecturer number', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $targetUser = User::factory()->role(UserRole::Lecturer)->create([
        'name' => 'Prof. Farah Warsame',
        'email' => 'farah.warsame@uct.edu',
    ]);
    Lecturer::factory()->create([
        'user_id' => $targetUser->id,
        'lecturer_no' => 'UCT-LEC-99881',
        'department' => 'Artificial Intelligence',
    ]);

    Lecturer::factory()->count(2)->create();

    $response = $this->get(route('admin.lecturers.index', ['search' => 'Farah Warsame']));
    $response->assertOk();

    $responseByNo = $this->get(route('admin.lecturers.index', ['search' => '99881']));
    $responseByNo->assertOk();
});

// ─── Create & Store ──────────────────────────────────────────────────────────

test('admin can view the create lecturer form', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.lecturers.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/lecturers/create'));
});

test('admin can create a new lecturer with auto-generated lecturer number', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.lecturers.store'), [
        'name' => 'Dr. Amina Yusuf',
        'email' => 'amina.yusuf@uct.edu',
        'department' => 'Software Engineering',
        'faculty' => 'Faculty of Computing & Information Technology',
        'designation' => 'Associate Professor',
        'qualification' => 'Ph.D. in Computer Science',
        'specialization' => 'Distributed Systems',
        'phone' => '+252 61 555 1234',
        'gender' => 'Female',
        'employment_status' => 'active',
        'contract_type' => 'full_time',
    ]);

    $response->assertRedirect();

    $user = User::where('email', 'amina.yusuf@uct.edu')->first();
    expect($user)->not->toBeNull()
        ->and($user->role)->toBe(UserRole::Lecturer);

    $lecturer = Lecturer::where('user_id', $user->id)->first();
    expect($lecturer)->not->toBeNull()
        ->and($lecturer->lecturer_no)->toStartWith('UCT-LEC-')
        ->and($lecturer->department)->toBe('Software Engineering');
});

test('lecturer creation validates required fields', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.lecturers.store'), []);

    $response->assertSessionHasErrors(['name', 'email', 'department', 'designation']);
});

test('lecturer creation enforces unique email and lecturer number', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    User::factory()->create(['email' => 'existing@uct.edu']);
    Lecturer::factory()->create(['lecturer_no' => 'UCT-LEC-11111']);

    $response = $this->post(route('admin.lecturers.store'), [
        'name' => 'Duplicate Test',
        'email' => 'existing@uct.edu',
        'lecturer_no' => 'UCT-LEC-11111',
        'department' => 'Computer Science',
        'designation' => 'Lecturer',
    ]);

    $response->assertSessionHasErrors(['email', 'lecturer_no']);
});

// ─── Show & Profile ──────────────────────────────────────────────────────────

test('admin can view a lecturer profile with assigned courses', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create();
    $course = Course::factory()->create();
    CourseAssignment::factory()->create([
        'lecturer_id' => $lecturer->id,
        'course_id' => $course->id,
        'status' => 'active',
        'workload_hours' => 3,
    ]);

    $response = $this->get(route('admin.lecturers.show', $lecturer));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/lecturers/show')
                ->has('lecturer')
                ->has('summary')
                ->where('summary.total_assignments', 1)
                ->where('summary.weekly_workload_hours', 3)
        );
});

// ─── Edit & Update ───────────────────────────────────────────────────────────

test('admin can view the edit lecturer form', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create();

    $response = $this->get(route('admin.lecturers.edit', $lecturer));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/lecturers/edit'));
});

test('admin can update a lecturer profile and user account', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create();

    $response = $this->put(route('admin.lecturers.update', $lecturer), [
        'name' => 'Updated Lecturer Name',
        'email' => 'updated.lecturer@uct.edu',
        'lecturer_no' => $lecturer->lecturer_no,
        'department' => 'Cyber Security',
        'faculty' => 'Faculty of Computing',
        'designation' => 'Professor',
        'employment_status' => 'active',
        'contract_type' => 'full_time',
    ]);

    $response->assertRedirect(route('admin.lecturers.show', $lecturer));

    $lecturer->refresh();
    expect($lecturer->user->name)->toBe('Updated Lecturer Name')
        ->and($lecturer->user->email)->toBe('updated.lecturer@uct.edu')
        ->and($lecturer->department)->toBe('Cyber Security')
        ->and($lecturer->designation)->toBe('Professor');
});

// ─── Actions: Toggle Status, Reset Password, Assign Course ───────────────────

test('admin can toggle lecturer employment status', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create(['employment_status' => 'active']);

    $response = $this->post(route('admin.lecturers.toggle-status', $lecturer));
    $response->assertRedirect();

    $lecturer->refresh();
    expect($lecturer->employment_status)->toBe('on_leave')
        ->and($lecturer->user->is_active)->toBeFalse();

    // Toggle back
    $this->post(route('admin.lecturers.toggle-status', $lecturer));
    $lecturer->refresh();
    expect($lecturer->employment_status)->toBe('active')
        ->and($lecturer->user->is_active)->toBeTrue();
});

test('admin can reset a lecturer password', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create();

    $response = $this->post(route('admin.lecturers.reset-password', $lecturer), [
        'password' => 'newSecretPass123',
    ]);

    $response->assertRedirect();

    $lecturer->refresh();
    expect(Hash::check('newSecretPass123', $lecturer->user->password))->toBeTrue();
});

test('admin can assign a course directly to a lecturer', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create();
    $course = Course::factory()->create();

    $response = $this->post(route('admin.lecturers.assign-course', $lecturer), [
        'course_id' => $course->id,
        'academic_year' => '2026/2027',
        'semester' => 'Semester 1',
        'section' => 'Section A',
        'role' => 'lead_lecturer',
        'workload_hours' => 3,
        'room' => 'Hall 4, Room 201',
        'schedule_day' => 'Monday',
        'schedule_time' => '10:00 - 12:00',
    ]);

    $response->assertRedirect();

    $assignment = CourseAssignment::where('lecturer_id', $lecturer->id)
        ->where('course_id', $course->id)
        ->first();

    expect($assignment)->not->toBeNull()
        ->and($assignment->role)->toBe('lead_lecturer')
        ->and($assignment->section)->toBe('Section A');
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

test('admin can soft delete a lecturer', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create();

    $response = $this->delete(route('admin.lecturers.destroy', $lecturer));
    $response->assertRedirect(route('admin.lecturers.index'));

    expect(Lecturer::find($lecturer->id))->toBeNull()
        ->and(Lecturer::withTrashed()->find($lecturer->id))->not->toBeNull()
        ->and($lecturer->fresh()->user->is_active)->toBeFalse();
});
