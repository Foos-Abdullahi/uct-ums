<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\StudentInvoice;
use App\Models\StudentPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

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
            'student_invoice_id' => StudentInvoice::factory(),
            'amount' => fake()->randomFloat(2, 100, 1500),
            'payment_method' => fake()->randomElement(['cash', 'bank_transfer', 'mobile_money']),
            'reference_number' => 'REF-'.strtoupper(fake()->bothify('####????')),
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
