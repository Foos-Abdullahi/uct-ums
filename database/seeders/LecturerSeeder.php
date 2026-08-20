<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LecturerSeeder extends Seeder
{
    /**
     * Seed the primary lecturer account for portal access.
     */
    public function run(): void
    {
        $user = User::query()->updateOrCreate(
            ['email' => 'lecturer@uct.edu'],
            [
                'name' => 'Dr. Ahmed Hassan',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Lecturer,
                'is_active' => true,
            ],
        );

        Staff::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'department' => 'Software Engineering',
                'position' => 'Senior Lecturer',
                'hire_date' => now()->subYears(3)->toDateString(),
            ],
        );
    }
}
