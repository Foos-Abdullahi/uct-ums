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
            [
                'name' => 'Bachelor of Science in Software Engineering',
                'code' => 'SE',
                'degree_level' => 'bachelor',
                'duration_semesters' => 8,
                'total_credits' => 130,
                'department' => 'Software Engineering',
                'faculty' => 'Faculty of Computing & Information Technology',
                'status' => 'active',
                'description' => 'Comprehensive undergraduate degree in software engineering, distributed systems, and enterprise architecture.',
            ],
            [
                'name' => 'Bachelor of Science in Networking and Cyber Security',
                'code' => 'NCS',
                'degree_level' => 'bachelor',
                'duration_semesters' => 8,
                'total_credits' => 128,
                'department' => 'Network & Security',
                'faculty' => 'Faculty of Computing & Information Technology',
                'status' => 'active',
                'description' => 'Focuses on network administration, infrastructure defense, routing protocols, and cyber security principles.',
            ],
            [
                'name' => 'Bachelor of Science in Animation and Visual Effects',
                'code' => 'AVE',
                'degree_level' => 'bachelor',
                'duration_semesters' => 8,
                'total_credits' => 120,
                'department' => 'Digital Arts & Media',
                'faculty' => 'Faculty of Arts & Design',
                'status' => 'active',
                'description' => 'Specialized program covering 2D/3D animation, visual effects, character design, and game asset production.',
            ],
        ];

        foreach ($programs as $prog) {
            Program::query()->updateOrCreate(
                ['name' => $prog['name']],
                $prog,
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
            ['matric_no' => 'UCT2026001'],
            [
                'user_id' => $studentUser->id,
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
            ['matric_no' => 'UCT2026002'],
            [
                'user_id' => $paidStudentUser->id,
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
