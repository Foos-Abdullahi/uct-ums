<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Lecturer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lecturer>
 */
class LecturerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $departments = [
            'Software Engineering',
            'Computer Networks & Cyber Security',
            'Data Science & Artificial Intelligence',
            'Information Technology',
            'Multimedia & Digital Arts',
        ];

        $faculties = [
            'Faculty of Computing & Information Technology',
            'Faculty of Engineering',
        ];

        $designations = [
            'Professor',
            'Associate Professor',
            'Senior Lecturer',
            'Lecturer',
            'Assistant Lecturer',
        ];

        $qualifications = [
            'Ph.D. in Computer Science',
            'Ph.D. in Software Engineering',
            'M.Sc. in Information Technology',
            'M.Sc. in Cyber Security',
            'M.Sc. in Computer Engineering',
        ];

        return [
            'user_id' => User::factory()->role(UserRole::Lecturer),
            'lecturer_no' => 'UCT-LEC-'.fake()->unique()->numerify('#####'),
            'department' => fake()->randomElement($departments),
            'faculty' => fake()->randomElement($faculties),
            'designation' => fake()->randomElement($designations),
            'qualification' => fake()->randomElement($qualifications),
            'specialization' => fake()->words(3, true),
            'phone' => fake()->phoneNumber(),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'date_of_birth' => fake()->dateTimeBetween('-60 years', '-25 years')->format('Y-m-d'),
            'address' => fake()->address(),
            'hire_date' => fake()->dateTimeBetween('-10 years', 'now')->format('Y-m-d'),
            'employment_status' => 'active',
            'contract_type' => fake()->randomElement(['full_time', 'part_time', 'adjunct', 'visiting']),
            'office_location' => 'Building A, Room '.fake()->numberBetween(101, 405),
            'bio' => fake()->paragraph(),
        ];
    }
}
