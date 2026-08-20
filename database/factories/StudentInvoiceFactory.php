<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentInvoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentInvoice>
 */
class StudentInvoiceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'description' => fake()->sentence(4),
            'amount' => fake()->randomFloat(2, 500, 3000),
            'due_date' => fake()->dateTimeBetween('now', '+60 days')->format('Y-m-d'),
            'status' => 'unpaid',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
        ]);
    }
}
