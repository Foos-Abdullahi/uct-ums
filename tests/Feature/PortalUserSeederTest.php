<?php

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\LecturerSeeder;
use Database\Seeders\StudentSeeder;
use Illuminate\Support\Facades\Hash;

test('lecturer seeder creates lecturer user with staff profile', function () {
    $this->seed(LecturerSeeder::class);

    $lecturer = User::query()->where('email', 'lecturer@uct.edu')->first();

    expect($lecturer)->not->toBeNull()
        ->and($lecturer->name)->toBe('Dr. Ahmed Hassan')
        ->and($lecturer->role)->toBe(UserRole::Lecturer)
        ->and($lecturer->is_active)->toBeTrue()
        ->and($lecturer->staff)->not->toBeNull()
        ->and(Hash::check('password', $lecturer->password))->toBeTrue();
});

test('lecturer can authenticate and is redirected to lecturer dashboard', function () {
    $this->seed(LecturerSeeder::class);

    $response = $this->post(route('login.store'), [
        'email' => 'lecturer@uct.edu',
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('lecturer.dashboard', absolute: false));
});

test('student seeder creates student user with paid enrollment', function () {
    $this->seed(StudentSeeder::class);

    $studentUser = User::query()->where('email', 'student@uct.edu')->first();

    expect($studentUser)->not->toBeNull()
        ->and($studentUser->name)->toBe('Mohamed Ali')
        ->and($studentUser->role)->toBe(UserRole::Student)
        ->and($studentUser->is_active)->toBeTrue()
        ->and(Hash::check('password', $studentUser->password))->toBeTrue();

    $student = Student::query()->where('user_id', $studentUser->id)->first();

    expect($student)->not->toBeNull()
        ->and($student->matric_no)->toBe('UCT2026001')
        ->and($student->fee_status)->toBe(FeeStatus::Paid);
});

test('student can authenticate and access student dashboard', function () {
    $this->seed(StudentSeeder::class);

    $response = $this->post(route('login.store'), [
        'email' => 'student@uct.edu',
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('student.dashboard', absolute: false));

    $dashboardResponse = $this->get(route('student.dashboard'));

    $dashboardResponse->assertOk();
});
