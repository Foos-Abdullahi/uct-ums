<?php

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Index ────────────────────────────────────────────────────────────────────

test('admin can view the teaching assignments index page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->get(route('admin.assignments.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/assignments/index'));
});

test('admin sees filters and courses on the assignments index', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    CourseAssignment::factory()->count(3)->create();

    $response = $this->get(route('admin.assignments.index'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->has('courses')
                ->has('departments')
                ->has('filters')
        );
});

test('admin can filter assignments by semester, role, and status', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $assignment = CourseAssignment::factory()->create([
        'semester' => 'Semester 1',
        'role' => 'lead_lecturer',
        'status' => 'active',
    ]);

    CourseAssignment::factory()->create([
        'semester' => 'Semester 2',
        'role' => 'lab_instructor',
        'status' => 'completed',
    ]);

    $response = $this->get(route('admin.assignments.index', [
        'semester' => 'Semester 1',
        'role' => 'lead_lecturer',
        'status' => 'active',
    ]));

    $response->assertOk();
});

// ─── Create & Store ──────────────────────────────────────────────────────────

test('admin can view the create assignment form', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    Lecturer::factory()->create(['employment_status' => 'active']);
    Course::factory()->create();

    $response = $this->get(route('admin.assignments.create'));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/assignments/create')
                ->has('lecturers')
                ->has('courses')
        );
});

test('admin can create a new teaching course assignment', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $lecturer = Lecturer::factory()->create();
    $course = Course::factory()->create();

    $response = $this->post(route('admin.assignments.store'), [
        'lecturer_id' => $lecturer->id,
        'course_id' => $course->id,
        'academic_year' => '2026/2027',
        'semester' => 'Semester 1',
        'section' => 'Section B',
        'role' => 'lead_lecturer',
        'status' => 'active',
        'workload_hours' => 3,
        'room' => 'Hall 2, Room 105',
        'schedule_day' => 'Sunday',
        'schedule_time' => '08:00 - 10:00',
        'notes' => 'Primary lecture sessions',
    ]);

    $response->assertRedirect();

    $assignment = CourseAssignment::where('lecturer_id', $lecturer->id)
        ->where('course_id', $course->id)
        ->where('section', 'Section B')
        ->first();

    expect($assignment)->not->toBeNull()
        ->and($assignment->role)->toBe('lead_lecturer')
        ->and($assignment->workload_hours)->toBe(3);
});

test('assignment creation validates required fields', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $response = $this->post(route('admin.assignments.store'), []);

    $response->assertSessionHasErrors(['lecturer_id', 'course_id', 'academic_year', 'semester', 'section', 'role', 'workload_hours']);
});

// ─── Show & Edit & Update ────────────────────────────────────────────────────

test('admin can view an assignment detail page', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $assignment = CourseAssignment::factory()->create();

    $response = $this->get(route('admin.assignments.show', $assignment));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('Admin/assignments/show')
                ->has('assignment')
        );
});

test('admin can view the edit assignment form', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $assignment = CourseAssignment::factory()->create();

    $response = $this->get(route('admin.assignments.edit', $assignment));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/assignments/edit'));
});

test('admin can update a course assignment', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $assignment = CourseAssignment::factory()->create();
    $newCourse = Course::factory()->create();

    $response = $this->put(route('admin.assignments.update', $assignment), [
        'lecturer_id' => $assignment->lecturer_id,
        'course_id' => $newCourse->id,
        'academic_year' => '2026/2027',
        'semester' => 'Semester 2',
        'section' => 'Section C',
        'role' => 'co_lecturer',
        'status' => 'active',
        'workload_hours' => 4,
        'room' => 'Lab 502',
        'schedule_day' => 'Tuesday',
        'schedule_time' => '13:00 - 15:00',
    ]);

    $response->assertRedirect(route('admin.assignments.show', $assignment));

    $assignment->refresh();
    expect($assignment->course_id)->toBe($newCourse->id)
        ->and($assignment->section)->toBe('Section C')
        ->and($assignment->role)->toBe('co_lecturer')
        ->and($assignment->workload_hours)->toBe(4);
});

// ─── Status Update & Destroy ─────────────────────────────────────────────────

test('admin can update assignment status directly', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $assignment = CourseAssignment::factory()->create(['status' => 'active']);

    $response = $this->patch(route('admin.assignments.status', $assignment), [
        'status' => 'completed',
    ]);

    $response->assertRedirect();

    $assignment->refresh();
    expect($assignment->status)->toBe('completed');
});

test('admin can delete a course assignment', function () {
    $admin = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($admin);

    $assignment = CourseAssignment::factory()->create();

    $response = $this->delete(route('admin.assignments.destroy', $assignment));
    $response->assertRedirect(route('admin.assignments.index'));

    expect(CourseAssignment::find($assignment->id))->toBeNull()
        ->and(CourseAssignment::withTrashed()->find($assignment->id))->not->toBeNull();
});
