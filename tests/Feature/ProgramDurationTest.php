<?php

use App\Enums\UserRole;
use App\Models\Program;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->actingAs(User::factory()->role(UserRole::SuperAdmin)->create());
});

function programPayload(array $overrides = []): array
{
    return array_merge([
        'name' => 'Certificate in Cyber Security',
        'code' => 'CCS',
        'degree_level' => 'certificate',
        'duration_semesters' => 6,
        'total_credits' => 24,
    ], $overrides);
}

test('a certificate program accepts a duration in months', function () {
    $this->post(route('admin.programs.store'), programPayload([
        'duration_semesters' => 12,
    ]))->assertRedirect();

    expect(Program::where('code', 'CCS')->sole()->duration_semesters)->toBe(12);
});

test('a certificate program may exceed the semester ceiling', function () {
    $this->post(route('admin.programs.store'), programPayload([
        'code' => 'LONG-CERT',
        'duration_semesters' => 36,
    ]))->assertRedirect();

    expect(Program::where('code', 'LONG-CERT')->sole()->duration_semesters)->toBe(36);
});

test('a non certificate program is still capped at sixteen semesters', function (string $degreeLevel) {
    $this->post(route('admin.programs.store'), programPayload([
        'code' => 'TOO-LONG',
        'degree_level' => $degreeLevel,
        'duration_semesters' => 24,
    ]))->assertSessionHasErrors('duration_semesters');

    $this->assertDatabaseMissing('programs', ['code' => 'TOO-LONG']);
})->with(['bachelor', 'master', 'doctorate', 'diploma']);

test('a duration of zero or less is rejected', function (int $duration) {
    $this->post(route('admin.programs.store'), programPayload([
        'code' => 'BAD-DURATION',
        'duration_semesters' => $duration,
    ]))->assertSessionHasErrors('duration_semesters');

    $this->assertDatabaseMissing('programs', ['code' => 'BAD-DURATION']);
})->with([0, -1, -6]);

test('a non whole number duration is rejected', function (string $duration) {
    $this->post(route('admin.programs.store'), programPayload([
        'code' => 'FRACTIONAL',
        'duration_semesters' => $duration,
    ]))->assertSessionHasErrors('duration_semesters');

    $this->assertDatabaseMissing('programs', ['code' => 'FRACTIONAL']);
})->with(['2.5', 'six', '']);

test('a duration of one is the lowest accepted value', function () {
    $this->post(route('admin.programs.store'), programPayload([
        'code' => 'ONE-MONTH',
        'duration_semesters' => 1,
    ]))->assertRedirect();

    expect(Program::where('code', 'ONE-MONTH')->sole()->duration_semesters)->toBe(1);
});

test('updating a program to a certificate raises the duration ceiling', function () {
    $program = Program::factory()->create([
        'code' => 'BSC-OLD',
        'degree_level' => 'bachelor',
        'duration_semesters' => 8,
        'total_credits' => 120,
    ]);

    $this->put(route('admin.programs.update', $program), [
        'name' => $program->name,
        'code' => 'BSC-OLD',
        'degree_level' => 'certificate',
        'duration_semesters' => 18,
        'total_credits' => 120,
    ])->assertSessionHasNoErrors();

    expect($program->fresh())
        ->degree_level->toBe('certificate')
        ->duration_semesters->toBe(18);
});

test('updating a program keeps its own code available', function () {
    $program = Program::factory()->create(['code' => 'KEEPME']);

    $this->put(route('admin.programs.update', $program), [
        'name' => $program->name,
        'code' => 'KEEPME',
        'degree_level' => 'bachelor',
        'duration_semesters' => 10,
        'total_credits' => 120,
    ])->assertRedirect();

    $this->assertDatabaseHas('programs', ['code' => 'KEEPME']);
});

test('another program code is still rejected', function () {
    Program::factory()->create(['code' => 'TAKEN']);

    $this->post(route('admin.programs.store'), programPayload([
        'code' => 'TAKEN',
    ]))->assertSessionHasErrors('code');
});
