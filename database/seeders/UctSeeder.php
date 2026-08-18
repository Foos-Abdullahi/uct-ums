<?php

namespace Database\Seeders;

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UctSeeder extends Seeder
{
    /**
     * Seed UCT programs and one demo user per role.
     */
    public function run(): void
    {
        $programs = [
            'Bachelor of Science in Software Engineering',
            'Bachelor of Science in Networking and Cyber Security',
            'Bachelor of Science in Animation and Visual Effects',
        ];

        foreach ($programs as $name) {
            Program::query()->firstOrCreate(
                ['name' => $name],
                ['degree_level' => 'bachelor', 'duration_semesters' => 8],
            );
        }

        $softwareEngineering = Program::query()->where('name', 'like', '%Software Engineering%')->first();

        $this->seedStaffUser(
            UserRole::SuperAdmin,
            'Super Admin',
            'admin@uct.so',
            'Academic Affairs',
            'System Administrator',
        );

        $this->seedStaffUser(
            UserRole::Registrar,
            'Registrar Admin',
            'registrar@uct.so',
            'Academic Affairs',
            'Registrar',
        );

        $this->seedStaffUser(
            UserRole::Finance,
            'Finance Officer',
            'finance@uct.so',
            'Finance',
            'Bursar',
        );

        $this->seedStaffUser(
            UserRole::Hr,
            'HR Officer',
            'hr@uct.so',
            'Human Resources',
            'HR Administrator',
        );

        $this->seedStaffUser(
            UserRole::Lecturer,
            'Lecturer Demo',
            'lecturer@uct.so',
            'Software Engineering',
            'Senior Lecturer',
        );

        $studentUser = User::query()->firstOrCreate(
            ['email' => 'student@uct.so'],
            [
                'name' => 'Student Demo',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Student,
                'is_active' => true,
            ],
        );

        Student::query()->firstOrCreate(
            ['user_id' => $studentUser->id],
            [
                'matric_no' => 'UCT2026001',
                'program_id' => $softwareEngineering?->id,
                'fee_status' => FeeStatus::Unpaid,
                'enrollment_date' => now()->toDateString(),
            ],
        );

        $paidStudentUser = User::query()->firstOrCreate(
            ['email' => 'student.paid@uct.so'],
            [
                'name' => 'Paid Student Demo',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => UserRole::Student,
                'is_active' => true,
            ],
        );

        Student::query()->firstOrCreate(
            ['user_id' => $paidStudentUser->id],
            [
                'matric_no' => 'UCT2026002',
                'program_id' => $softwareEngineering?->id,
                'fee_status' => FeeStatus::Paid,
                'enrollment_date' => now()->toDateString(),
            ],
        );
    }

    private function seedStaffUser(
        UserRole $role,
        string $name,
        string $email,
        string $department,
        string $position,
    ): void {
        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => $role,
                'is_active' => true,
            ],
        );

        Staff::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'department' => $department,
                'position' => $position,
                'hire_date' => now()->subYear()->toDateString(),
            ],
        );
    }
}
