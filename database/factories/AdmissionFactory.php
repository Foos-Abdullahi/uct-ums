<?php

namespace Database\Factories;

use App\Models\Admission;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Admission>
 */
class AdmissionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'application_no' => 'ADM-2026-'.fake()->unique()->numerify('#####'),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'date_of_birth' => fake()->dateTimeBetween('-24 years', '-18 years')->format('Y-m-d'),
            'address' => fake()->address(),
            'program_id' => Program::factory(),
            'entry_semester' => 'Semester 1',
            'previous_qualification' => 'High School Certificate',
            'previous_gpa' => fake()->randomFloat(2, 2.5, 4.0),
            'status' => 'pending',
            'application_date' => now()->subDays(fake()->numberBetween(1, 30))->toDateString(),
            'notes' => fake()->sentence(),
            'review_notes' => null,
            'student_id' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'review_notes' => 'Application approved based on qualifying requirements.',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'review_notes' => 'Does not meet minimum requirements.',
        ]);
    }

    public function enrolled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'enrolled',
        ]);
    }
}
