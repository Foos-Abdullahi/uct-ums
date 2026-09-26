<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Password applied only when the super admin account is first created.
     */
    private const INITIAL_PASSWORD = 'password';

    /**
     * Seed the primary super admin account for system access.
     *
     * Idempotent for every attribute except the password: an existing password
     * is never overwritten, so rotating it on a live environment survives
     * subsequent deploys instead of being silently reset.
     */
    public function run(): void
    {
        $user = User::query()->firstOrNew(['email' => 'admin@uct.edu']);

        $user->fill([
            'name' => 'System Administrator',
            'email_verified_at' => now(),
            'role' => UserRole::SuperAdmin,
            'is_active' => true,
        ]);

        if (! $user->exists) {
            $user->password = self::INITIAL_PASSWORD;
        }

        $user->save();

        Staff::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'department' => 'Academic Affairs',
                'position' => 'System Administrator',
                'hire_date' => now()->subYear()->toDateString(),
            ],
        );
    }
}
