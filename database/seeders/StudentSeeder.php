<?php

namespace Database\Seeders;

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    /**
     * Seed the primary student account for portal access.
     */
    public function run(): void
    {
        $program = Program::query()->firstOrCreate(
            ['name' => 'Bachelor of Science in Software Engineering'],
            ['degree_level' => 'bachelor', 'duration_semesters' => 8],
        );

        $user = User::query()->updateOrCreate(
            ['email' => 'student@uct.edu'],
            [
                'name' => 'Mohamed Ali',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Student,
                'is_active' => true,
            ],
        );

        Student::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'matric_no' => 'UCT2026001',
                'program_id' => $program->id,
                'fee_status' => FeeStatus::Paid,
                'enrollment_date' => now()->subMonths(6)->toDateString(),
            ],
        );
    }
}
