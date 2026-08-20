<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the primary super admin account for system access.
     */
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'admin@uct.edu'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::SuperAdmin,
                'is_active' => true,
            ],
        );

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
