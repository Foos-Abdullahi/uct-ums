<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Support\Facades\Hash;

test('admin seeder creates super admin user', function () {
    $this->seed(AdminSeeder::class);

    $admin = User::query()->where('email', 'admin@uct.edu')->first();

    expect($admin)->not->toBeNull()
        ->and($admin->name)->toBe('System Administrator')
        ->and($admin->role)->toBe(UserRole::SuperAdmin)
        ->and($admin->is_active)->toBeTrue()
        ->and(Hash::check('password', $admin->password))->toBeTrue();
});

test('re-seeding does not overwrite an existing admin password', function () {
    $this->seed(AdminSeeder::class);

    $admin = User::query()->where('email', 'admin@uct.edu')->firstOrFail();
    $admin->forceFill(['password' => 'a-rotated-password'])->save();

    $this->seed(AdminSeeder::class);

    $admin->refresh();

    expect(Hash::check('a-rotated-password', $admin->password))->toBeTrue()
        ->and(Hash::check('password', $admin->password))->toBeFalse();
});

test('re-seeding still repairs drifted admin attributes', function () {
    $this->seed(AdminSeeder::class);

    $admin = User::query()->where('email', 'admin@uct.edu')->firstOrFail();
    $admin->forceFill(['name' => 'Drifted Name', 'is_active' => false])->save();

    $this->seed(AdminSeeder::class);

    $admin->refresh();

    expect($admin->name)->toBe('System Administrator')
        ->and($admin->is_active)->toBeTrue();
});

test('admin can authenticate and is redirected to admin dashboard', function () {
    $this->seed(AdminSeeder::class);

    $response = $this->post(route('login.store'), [
        'email' => 'admin@uct.edu',
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('admin.dashboard', absolute: false));
});
