<?php

namespace Database\Factories;

use App\Enums\FeeStatus;
use App\Enums\UserRole;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->role(UserRole::Student),
            'matric_no' => 'UCT-2026-'.fake()->unique()->numerify('#####'),
            'program_id' => Program::factory(),
            'current_semester' => fake()->numberBetween(1, 8),
            'phone' => fake()->phoneNumber(),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'date_of_birth' => fake()->dateTimeBetween('-25 years', '-18 years')->format('Y-m-d'),
            'address' => fake()->address(),
            'fee_status' => FeeStatus::Unpaid,
            'enrollment_status' => 'enrolled',
            'gpa' => fake()->randomFloat(2, 2.0, 4.0),
            'enrollment_date' => now()->toDateString(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'fee_status' => FeeStatus::Paid,
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'enrollment_status' => 'suspended',
        ]);
    }

    public function graduated(): static
    {
        return $this->state(fn (array $attributes) => [
            'enrollment_status' => 'graduated',
            'graduation_date' => now()->subMonths(2)->toDateString(),
        ]);
    }
}
