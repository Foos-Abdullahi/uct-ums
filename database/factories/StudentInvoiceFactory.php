<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentInvoice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
            'invoice_no' => 'INV-'.date('Y').'-'.strtoupper(Str::random(6)),
            'title' => fake()->sentence(3),
            'type' => fake()->randomElement(['tuition', 'registration', 'exam', 'lab', 'other']),
            'amount' => fake()->randomFloat(2, 500, 3000),
            'paid_amount' => 0.00,
            'due_date' => fake()->dateTimeBetween('now', '+60 days')->format('Y-m-d'),
            'status' => 'unpaid',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_amount' => $attributes['amount'],
        ]);
    }
}
