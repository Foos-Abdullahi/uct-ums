<?php

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Lecturer;
use App\Models\TeachingSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->actingAs(User::factory()->role(UserRole::SuperAdmin)->create());
});

test('payroll page lists hours per lecturer at the hourly rate', function () {
    $lecturer = Lecturer::factory()->create();
    $math = Course::factory()->create();
    $physics = Course::factory()->create();

    TeachingSession::factory()->create(['lecturer_id' => $lecturer->id, 'course_id' => $math->id, 'session_date' => '2026-10-03', 'hours' => 2]);
    TeachingSession::factory()->create(['lecturer_id' => $lecturer->id, 'course_id' => $physics->id, 'session_date' => '2026-10-07', 'hours' => 3]);
    TeachingSession::factory()->create(['lecturer_id' => $lecturer->id, 'course_id' => $math->id, 'session_date' => '2026-09-30', 'hours' => 5]);

    $this->get(route('admin.lecturer-payroll.index', ['month' => '2026-10']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/lecturer-payroll/index')
            ->where('totals.hours', 5)
            ->where('totals.total', 40)
            ->where('totals.outstanding', 40)
            ->has('rows', 1)
            ->where('rows.0.courses', fn ($courses) => count($courses) === 2)
            ->where('rows.0.status', 'unpaid'));
});

test('hours can be recorded for a lecturer and course', function () {
    $lecturer = Lecturer::factory()->create();
    $course = Course::factory()->create();

    $this->post(route('admin.lecturer-payroll.store'), [
        'lecturer_id' => $lecturer->id,
        'course_id' => $course->id,
        'session_date' => now()->toDateString(),
        'hours' => 2.5,
    ])->assertRedirect();

    $session = TeachingSession::first();
    expect($session->hourly_rate)->toBe(8.0)
        ->and($session->amount)->toBe(20.0);
});

test('recording hours validates input', function () {
    $this->post(route('admin.lecturer-payroll.store'), [
        'session_date' => now()->addDay()->toDateString(),
        'hours' => 0,
    ])->assertSessionHasErrors(['lecturer_id', 'course_id', 'session_date', 'hours']);
});

test('a lecturer month can be marked paid and reverted', function () {
    $lecturer = Lecturer::factory()->create();
    TeachingSession::factory()->count(2)->create(['lecturer_id' => $lecturer->id, 'session_date' => '2026-10-05', 'hours' => 1]);

    $this->post(route('admin.lecturer-payroll.mark-paid', $lecturer), ['month' => '2026-10'])->assertRedirect();
    expect(TeachingSession::whereNull('paid_at')->count())->toBe(0);

    $this->delete(route('admin.lecturer-payroll.mark-unpaid', $lecturer), ['month' => '2026-10'])->assertRedirect();
    expect(TeachingSession::whereNotNull('paid_at')->count())->toBe(0);
});

test('paid entries cannot be edited or deleted', function () {
    $session = TeachingSession::factory()->paid()->create(['hours' => 2]);

    $this->put(route('admin.lecturer-payroll.update', $session), [
        'lecturer_id' => $session->lecturer_id,
        'course_id' => $session->course_id,
        'session_date' => now()->toDateString(),
        'hours' => 9,
    ]);
    $this->delete(route('admin.lecturer-payroll.destroy', $session));

    expect($session->fresh()->hours)->toBe(2.0);
});

test('unpaid entries can be edited and deleted', function () {
    $session = TeachingSession::factory()->create(['hours' => 2]);

    $this->put(route('admin.lecturer-payroll.update', $session), [
        'lecturer_id' => $session->lecturer_id,
        'course_id' => $session->course_id,
        'session_date' => now()->toDateString(),
        'hours' => 4,
    ])->assertRedirect();
    expect($session->fresh()->hours)->toBe(4.0);

    $this->delete(route('admin.lecturer-payroll.destroy', $session))->assertRedirect();
    expect(TeachingSession::count())->toBe(0);
});
