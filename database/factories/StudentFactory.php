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
            'matric_no' => 'UCT'.fake()->unique()->numerify('######'),
            'program_id' => Program::factory(),
            'fee_status' => FeeStatus::Unpaid,
            'enrollment_date' => now()->toDateString(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'fee_status' => FeeStatus::Paid,
        ]);
    }
}
