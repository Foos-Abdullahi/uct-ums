<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\CourseAssignment;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LecturerSeeder extends Seeder
{
    /**
     * Seed the primary lecturer account and sample teaching courses.
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

        $lecturer = Lecturer::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'lecturer_no' => 'UCT-LEC-00001',
                'department' => 'Software Engineering',
                'faculty' => 'Faculty of Computing & Information Technology',
                'designation' => 'Senior Lecturer',
                'qualification' => 'Ph.D. in Computer Science',
                'specialization' => 'Distributed Systems & Cloud Architecture',
                'phone' => '+252 61 555 0199',
                'gender' => 'Male',
                'date_of_birth' => '1984-06-15',
                'address' => 'Mogadishu, Somalia',
                'hire_date' => now()->subYears(3)->toDateString(),
                'employment_status' => 'active',
                'contract_type' => 'full_time',
                'office_location' => 'Building B, Room 204',
                'bio' => 'Senior lecturer with over 10 years of academic and industry experience in software engineering and cloud computing.',
            ],
        );

        // Keep staff record in sync if needed
        Staff::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'department' => 'Software Engineering',
                'position' => 'Senior Lecturer',
                'hire_date' => now()->subYears(3)->toDateString(),
            ],
        );

        $program = Program::query()->first();

        // Seed core courses if not present
        $courses = [
            [
                'code' => 'SWE301',
                'name' => 'Software Architecture & Design',
                'credit_hours' => 3,
                'semester' => 5,
                'program_id' => $program?->id,
            ],
            [
                'code' => 'CS101',
                'name' => 'Introduction to Computer Science',
                'credit_hours' => 3,
                'semester' => 1,
                'program_id' => $program?->id,
            ],
            [
                'code' => 'SEC402',
                'name' => 'Cyber Security Principles',
                'credit_hours' => 4,
                'semester' => 7,
                'program_id' => $program?->id,
            ],
        ];

        foreach ($courses as $c) {
            $course = Course::query()->firstOrCreate(
                ['code' => $c['code']],
                [
                    'name' => $c['name'],
                    'credit_hours' => $c['credit_hours'],
                    'semester' => $c['semester'],
                    'program_id' => $c['program_id'],
                    'status' => 'active',
                    'level' => 'undergraduate',
                ]
            );

            CourseAssignment::query()->firstOrCreate(
                [
                    'lecturer_id' => $lecturer->id,
                    'course_id' => $course->id,
                    'academic_year' => '2026/2027',
                    'semester' => 'Semester 1',
                    'section' => 'Section A',
                ],
                [
                    'role' => 'lead_lecturer',
                    'status' => 'active',
                    'workload_hours' => $course->credit_hours,
                    'room' => 'Hall 3, Room 102',
                    'schedule_day' => 'Monday',
                    'schedule_time' => '08:00 - 10:00',
                ]
            );
        }
    }
}
