<?php

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Student;
use App\Models\User;

test('unpaid students are redirected to the locked fees screen', function () {
    $student = Student::factory()->create(['fee_status' => FeeStatus::Unpaid]);
    $this->actingAs($student->user);

    $response = $this->get(route('student.dashboard'));

    $response->assertRedirect(route('student.fees.locked'));
});

test('paid students can access their dashboard', function () {
    $student = Student::factory()->paid()->create();
    $this->actingAs($student->user);

    $response = $this->get(route('student.dashboard'));

    $response->assertOk();
});

test('unpaid students can access the fees payment page', function () {
    $student = Student::factory()->create(['fee_status' => FeeStatus::Unpaid]);
    $this->actingAs($student->user);

    $response = $this->get(route('student.fees.index'));

    $response->assertOk();
});

test('registrar cannot access finance portal routes', function () {
    $user = User::factory()->role(UserRole::Registrar)->create();
    $this->actingAs($user);

    $response = $this->get(route('finance.dashboard'));

    $response->assertForbidden();
});

test('super admin can access registrar portal routes', function () {
    $user = User::factory()->role(UserRole::SuperAdmin)->create();
    $this->actingAs($user);

    $response = $this->get(route('registrar.dashboard'));

    $response->assertOk();
});
