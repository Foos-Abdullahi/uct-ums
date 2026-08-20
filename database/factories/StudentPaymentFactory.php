<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentPayment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<StudentPayment>
 */
class StudentPaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'invoice_id' => null,
            'transaction_no' => 'TXN-'.strtoupper(Str::random(8)),
            'amount' => fake()->randomFloat(2, 100, 1500),
            'payment_method' => fake()->randomElement(['cash', 'bank_transfer', 'card']),
            'payment_date' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'status' => 'pending',
            'notes' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }
}
